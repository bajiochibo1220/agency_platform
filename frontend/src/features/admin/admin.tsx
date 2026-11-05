"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Asterisk,
  ArrowUpRight,
  Plus,
  Search,
  LogOut,
  LayoutDashboard,
  FolderKanban,
  Users,
  Settings,
  FileText,
  MessageSquare,
  Video,
  Image,
  BarChart3,
  PanelTop,
  Menu,
  X,
  Check,
  Clock,
  Save,
  History,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import { api, type Item } from "@/lib/api";
import {
  schemas,
  settingsGroups,
  labels,
  modules,
  allowed,
  defaults,
  type Field,
} from "./schema";

const icons: Record<string, typeof Asterisk> = {
  overview: LayoutDashboard,
  settings: Settings,
  projects: FolderKanban,
  team: Users,
  enquiries: MessageSquare,
  videos: Video,
  media: Image,
  analytics: BarChart3,
  users: Users,
  quotations: FileText,
};
type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
};
export function Admin() {
  const [user, setUser] = useState<User | null>(null),
    [checking, setChecking] = useState(true),
    [module, setModule] = useState("overview"),
    [sidebar, setSidebar] = useState(false),
    [toast, setToast] = useState(""),
    [error, setError] = useState("");
  const [data, setData] = useState<any>(null),
    [busy, setBusy] = useState(false),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState(""),
    [page, setPage] = useState(1),
    [editing, setEditing] = useState<any>(null),
    [history, setHistory] = useState<any[] | null>(null),
    [preview, setPreview] = useState(false),
    [assignees, setAssignees] = useState<User[]>([]);
  const [settingsTab, setSettingsTab] = useState("Brand & homepage");
  const editorRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!editing) return;
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = setTimeout(
      () =>
        editorRef.current
          ?.querySelector<HTMLElement>("button,input,select,textarea")
          ?.focus(),
      0,
    );
    function keyboard(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) {
        setEditing(null);
        return;
      }
      if (e.key !== "Tab") return;
      const elements = Array.from(
        editorRef.current?.querySelectorAll<HTMLElement>(
          "button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]",
        ) || [],
      ).filter((el) => el.offsetParent !== null);
      const first = elements[0],
        last = elements[elements.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      }
      if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener("keydown", keyboard);
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", keyboard);
      previous?.focus();
    };
  }, [!!editing, busy]);
  useEffect(() => {
    api("/auth/me")
      .then(setUser)
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(id);
  }, [toast]);
  const load = useCallback(async () => {
    if (!user) return;
    setBusy(true);
    setError("");
    try {
      const path =
        module === "overview"
          ? "/admin/overview"
          : module === "settings"
            ? "/admin/settings"
            : module === "analytics"
              ? "/admin/analytics"
              : module === "users"
                ? "/admin/users"
                : module === "audit"
                  ? `/admin/audit?page=${page}`
                  : `/admin/records/${module}?q=${encodeURIComponent(query)}&page=${page}&status=${encodeURIComponent(filter)}`;
      setData(await api(path));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [user, module, page, query, filter]);
  useEffect(() => {
    const id = setTimeout(load, 180);
    return () => clearTimeout(id);
  }, [load]);
  useEffect(() => {
    if (user)
      api("/admin/assignees")
        .then(setAssignees)
        .catch(() => {});
  }, [user]);
  function go(m: string) {
    setModule(m);
    setPage(1);
    setQuery("");
    setFilter("");
    setEditing(null);
    setData(null);
    setSidebar(false);
    setError("");
  }
  async function signout() {
    await api("/auth/logout", "POST");
    setUser(null);
    setData(null);
  }
  function edit(row: any) {
    setEditing({ ...row });
    setHistory(null);
    setPreview(false);
    setError("");
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { id, kind, version, updated, ...values } = editing;
      if (module === "users") {
        await api(
          `/admin/users${id ? "/" + id : ""}`,
          id ? "PUT" : "POST",
          values,
        );
        if (id === user?.id) {
          setUser(null);
          setEditing(null);
          setData(null);
          return;
        }
      } else
        await api(
          `/admin/records/${module}${id ? "/" + id : ""}`,
          id ? "PUT" : "POST",
          { data: values, version },
        );
      setEditing(null);
      setToast("Changes saved.");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(row: Item) {
    if (
      !confirm(
        `Delete “${row.title}”? This removes the record and its history.`,
      )
    )
      return;
    try {
      await api(`/admin/records/${module}/${row.id}`, "DELETE");
      setToast("Record deleted.");
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { id, kind, version, updated, ...values } = data;
      setData(await api("/admin/settings", "PUT", { data: values, version }));
      setToast("Settings saved. Open the website to see your changes.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.set("file", file);
      await api("/admin/media", "POST", form);
      setToast(
        "File uploaded. Copy its path into any content image or video field.",
      );
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }
  if (checking)
    return (
      <div className="loading-screen">
        <Asterisk className="spin" /> Opening the studio…
      </div>
    );
  if (!user) return <Login onLogin={setUser} />;
  const userFields: Field[] = [
    { key: "name", label: "Full name", required: true },
    { key: "email", label: "Email", type: "email", required: true },
    {
      key: "role",
      label: "Role",
      type: "select",
      options: [
        "super_admin",
        "administrator",
        "content_manager",
        "sales",
        "team_member",
      ],
    },
    { key: "active", label: "Account active", type: "checkbox" },
    {
      key: "password",
      label: editing?.id
        ? "New password (leave blank to keep)"
        : "Password (12+ characters)",
      type: "password",
      required: !editing?.id,
    },
  ];
  const fields = module === "users" ? userFields : schemas[module] || [];
  const list = Array.isArray(data) ? data : data?.items || [];
  const titles: Record<string, string> = {
    overview: "A clearer view of your studio.",
    enquiries: "Every conversation starts here.",
    projects: "Show what you can do.",
    settings: "Make it yours.",
    quotations: "Turn possibilities into proposals.",
    analytics: "Understand the next opportunity.",
  };
  return (
    <div className="admin-app">
      <aside className={`admin-sidebar ${sidebar ? "is-open" : ""}`}>
        <Link href="/" className="brand">
          <span className="brand-symbol">
            <Asterisk size={25} />
          </span>
          <span>
            Studio<span className="brand-dot">.</span>
          </span>
        </Link>
        <p className="sidebar-caption">YOUR WORKSPACE</p>
        <nav aria-label="Dashboard navigation">
          {modules
            .filter((m) => allowed(user.role, m))
            .map((m) => {
              const Icon = icons[m] || PanelTop;
              return (
                <button
                  key={m}
                  onClick={() => go(m)}
                  className={module === m ? "active" : ""}
                >
                  <Icon size={18} />
                  {labels[m]}
                  {m === module && <span className="sidebar-indicator" />}
                </button>
              );
            })}
        </nav>
        <div className="sidebar-bottom">
          <Link href="/" target="_blank">
            View website <ArrowUpRight size={17} />
          </Link>
          <button onClick={signout}>
            <LogOut size={17} />
            Sign out
          </button>
          <small>
            {user.name}
            <br />
            {user.role.replaceAll("_", " ")}
          </small>
        </div>
      </aside>
      {sidebar && (
        <button
          className="sidebar-shade"
          aria-label="Close sidebar"
          onClick={() => setSidebar(false)}
        />
      )}
      <div className="admin-main">
        <header className="admin-header">
          <div>
            <button
              className="admin-menu-button"
              aria-label="Open dashboard menu"
              onClick={() => setSidebar(!sidebar)}
            >
              <Menu size={22} />
            </button>
            <span>
              Workspace <span className="muted">/</span> {labels[module]}
            </span>
          </div>
          <div>
            <span className="admin-live">
              <span className="status-dot" /> Your studio, connected
            </span>
            <span className="user-avatar">{user.name[0]}</span>
          </div>
        </header>
        <main className="admin-content">
          <div className="admin-page-heading">
            <div>
              <p className="eyebrow">{labels[module]}</p>
              <h1>
                {titles[module] || `Manage ${labels[module].toLowerCase()}.`}
              </h1>
              <p>
                {module === "overview"
                  ? `Welcome back, ${user.name.split(" ")[0]}. Here’s what’s happening.`
                  : module === "enquiries"
                    ? "Track the next step, assign a teammate and keep the conversation moving."
                    : module === "media"
                      ? "Images, PDFs and short videos. Maximum file size: 10 MB."
                      : module === "users"
                        ? "Permissions are enforced by the API. Sales users see only their assigned records."
                        : "Keep your website and your business moving forward."}
              </p>
            </div>
            {schemas[module] && user.role !== "team_member" && (
              <button className="button" onClick={() => edit(defaults(module))}>
                <Plus size={17} />
                Add{" "}
                {labels[module] === "Portfolio"
                  ? "project"
                  : module === "enquiries"
                    ? "enquiry"
                    : module === "team"
                      ? "team member"
                      : labels[module].toLowerCase().replace(/s$/, "")}
              </button>
            )}
            {module === "users" && (
              <button
                className="button"
                onClick={() =>
                  edit({
                    name: "",
                    email: "",
                    role: "content_manager",
                    active: true,
                    password: "",
                  })
                }
              >
                <Plus size={17} />
                Add user
              </button>
            )}
            {module === "media" && (
              <label className="button upload-button">
                <Plus size={17} />
                Upload a file
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,video/mp4,application/pdf"
                  onChange={upload}
                  disabled={busy}
                />
              </label>
            )}
          </div>
          {error && (
            <div className="error-message" role="alert">
              {error}
              <button onClick={() => setError("")} aria-label="Dismiss error">
                <X size={16} />
              </button>
            </div>
          )}
          {busy && !editing && (
            <p className="loading-note" role="status">
              Loading…
            </p>
          )}
          {module === "overview" && data && (
            <>
              <div className="stat-grid">
                {[
                  [
                    "Enquiries",
                    data.counts.enquiries ?? "—",
                    "A conversation worth starting",
                    MessageSquare,
                  ],
                  [
                    "Portfolio",
                    data.counts.projects ?? "—",
                    "Ideas and work to explore",
                    FolderKanban,
                  ],
                  [
                    "Quotations",
                    data.counts.quotations ?? "—",
                    "The next step, in writing",
                    FileText,
                  ],
                  [
                    "Page views",
                    data.views ?? "—",
                    "Aggregate views · all time",
                    BarChart3,
                  ],
                ].map(([label, value, note, Icon]: any) => (
                  <div className="stat-card" key={label}>
                    <div>
                      <span>{label}</span>
                      <Icon size={19} />
                    </div>
                    <strong>{value}</strong>
                    <small>{note}</small>
                  </div>
                ))}
              </div>
              <div className="overview-grid">
                <section className="admin-panel">
                  <div className="panel-title">
                    <h2>Your next good move.</h2>
                    <Asterisk size={24} />
                  </div>
                  <p>
                    Give a potential client a clearer picture of what you can
                    build together.
                  </p>
                  <div className="quick-actions">
                    {["enquiries", "projects", "quotations", "settings"]
                      .filter((m) => allowed(user.role, m))
                      .map((m) => (
                        <button key={m} onClick={() => go(m)}>
                          {labels[m]}
                          <ArrowUpRight size={18} />
                        </button>
                      ))}
                  </div>
                </section>
                <section className="admin-panel">
                  <h2>Recent studio activity</h2>
                  {data.activity.length ? (
                    data.activity.map((a: any, i: number) => (
                      <div className="activity-row" key={i}>
                        <span className="activity-dot">
                          <Check size={12} />
                        </span>
                        <div>
                          <strong>{a.action.replaceAll("_", " ")}</strong>
                          <small>
                            {a.actor} · {new Date(a.created).toLocaleString()}
                          </small>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="muted">
                      Activity will appear here as your team works.
                    </p>
                  )}
                </section>
              </div>
              <div className="admin-tip">
                <ShieldIcon />{" "}
                <span>
                  Ready for your own identity? Add your real brand, contact
                  details, team and authorized project examples before sharing
                  the website.
                </span>
                <Link href="/" target="_blank">
                  Preview website ↗
                </Link>
              </div>
            </>
          )}
          {module === "settings" && data && (
            <form onSubmit={saveSettings}>
              <div className="settings-tabs">
                {Object.keys(settingsGroups).map((g) => (
                  <button
                    type="button"
                    className={settingsTab === g ? "selected" : ""}
                    key={g}
                    onClick={() => setSettingsTab(g)}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <section className="admin-panel settings-panel">
                <h2>{settingsTab}</h2>
                <div className="editor-grid">
                  {settingsGroups[settingsTab].map((f) => (
                    <FormField
                      field={f}
                      value={data[f.key]}
                      onChange={(v) => setData({ ...data, [f.key]: v })}
                      assignees={assignees}
                      key={f.key}
                    />
                  ))}
                </div>
                <button className="button" disabled={busy}>
                  <Save size={17} />
                  Save settings
                </button>
              </section>
            </form>
          )}
          {module === "analytics" && data && (
            <>
              <div className="stat-grid">
                <div className="stat-card">
                  <span>Page views · last 30 active days</span>
                  <strong>
                    {data.days.reduce((n: number, d: any) => n + d.views, 0)}
                  </strong>
                </div>
                <div className="stat-card">
                  <span>Enquiries · all time</span>
                  <strong>{data.enquiries}</strong>
                </div>
                <div className="stat-card">
                  <span>Won enquiries</span>
                  <strong>{data.won}</strong>
                </div>
                <div className="stat-card">
                  <span>Enquiry → won</span>
                  <strong>
                    {data.enquiries
                      ? Math.round((data.won / data.enquiries) * 100)
                      : 0}
                    %
                  </strong>
                </div>
              </div>
              <section className="admin-panel">
                <h2>Page views over time</h2>
                <p className="muted">
                  Aggregate counts. No visitor IP addresses or cross-site
                  identifiers are stored. Counts are indicative and may include
                  automated traffic.
                </p>
                <div className="analytics-chart">
                  {data.days.map((d: any) => (
                    <div key={d.date} title={`${d.date}: ${d.views} views`}>
                      <span>{d.views}</span>
                      <i
                        style={{
                          height: `${Math.max(6, (d.views / Math.max(...data.days.map((x: any) => x.views), 1)) * 150)}px`,
                        }}
                      />
                      <small>{d.date.slice(5)}</small>
                    </div>
                  ))}
                </div>
                {!data.days.length && <p>No visits recorded yet.</p>}
              </section>
              <div className="overview-grid">
                {["sources", "stages"].map((key) => (
                  <section className="admin-panel" key={key}>
                    <h2>
                      {key === "sources"
                        ? "Where enquiries begin"
                        : "The enquiry pipeline"}
                    </h2>
                    {Object.entries(data[key]).map(([name, value]) => (
                      <div className="metric-row" key={name}>
                        <span>{name}</span>
                        <strong>{String(value)}</strong>
                      </div>
                    ))}
                    {!Object.keys(data[key]).length && <p>No enquiries yet.</p>}
                  </section>
                ))}
              </div>
            </>
          )}
          {(schemas[module] ||
            ["users", "media", "audit"].includes(module)) && (
            <section className="admin-panel records-panel">
              {module !== "audit" && module !== "users" && (
                <div className="records-toolbar">
                  <label className="search-box">
                    <Search size={17} />
                    <span className="sr-only">Search records</span>
                    <input
                      placeholder={`Search ${labels[module].toLowerCase()}…`}
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setPage(1);
                      }}
                    />
                  </label>
                  {schemas[module]?.some((f) =>
                    ["status", "stage"].includes(f.key),
                  ) && (
                    <label>
                      <span className="sr-only">Filter by status</span>
                      <select
                        value={filter}
                        onChange={(e) => {
                          setFilter(e.target.value);
                          setPage(1);
                        }}
                      >
                        <option value="">All statuses</option>
                        {(
                          schemas[module].find((f) =>
                            ["status", "stage"].includes(f.key),
                          )?.options || []
                        ).map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </label>
                  )}
                  <span className="muted">{data?.total || 0} records</span>
                </div>
              )}
              {module === "media" ? (
                <div className="media-grid">
                  {list.map((r: Item) => (
                    <article className="media-card" key={r.id}>
                      {r.mime.startsWith("image/") ? (
                        <img src={r.url} alt={r.title} />
                      ) : (
                        <div className="media-placeholder">
                          {r.mime === "video/mp4" ? <Video /> : <FileText />}
                        </div>
                      )}
                      <strong>{r.title}</strong>
                      <small>{Math.ceil(r.size / 1024)} KB</small>
                      <input
                        readOnly
                        aria-label={`Path for ${r.title}`}
                        value={r.url}
                        onFocus={(e) => e.target.select()}
                      />
                      <div>
                        <button
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(r.url);
                              setToast("Media path copied.");
                            } catch {
                              setToast("Select the path above and copy it.");
                            }
                          }}
                        >
                          Copy path
                        </button>
                        <button
                          onClick={() => remove(r)}
                          aria-label={`Delete ${r.title}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        {module === "audit" ? (
                          <>
                            <th>Action</th>
                            <th>Actor</th>
                            <th>Target</th>
                            <th>When</th>
                          </>
                        ) : (
                          <>
                            <th>
                              {module === "users" ? "User" : "Name / title"}
                            </th>
                            <th>{module === "users" ? "Role" : "Status"}</th>
                            <th>
                              {module === "users" ? "Account" : "Updated"}
                            </th>
                            <th>
                              <span className="sr-only">Actions</span>
                            </th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((r: any, i: number) =>
                        module === "audit" ? (
                          <tr key={r.id || i}>
                            <td>{r.action}</td>
                            <td>{r.actor}</td>
                            <td className="mono small">{r.target}</td>
                            <td>{new Date(r.created).toLocaleString()}</td>
                          </tr>
                        ) : (
                          <tr key={r.id}>
                            <td>
                              <strong>{r.title || r.name}</strong>
                              <small>
                                {r.email ||
                                  r.category ||
                                  r.slug ||
                                  r.role ||
                                  r.service ||
                                  r.number ||
                                  ""}
                              </small>
                            </td>
                            <td>
                              <span
                                className={`badge ${(r.status || r.stage) === "published" ? "published" : ""}`}
                              >
                                {r.status ||
                                  r.stage ||
                                  r.role?.replaceAll("_", " ") ||
                                  "—"}
                              </span>
                            </td>
                            <td>
                              {module === "users"
                                ? r.active
                                  ? "Active"
                                  : "Disabled"
                                : new Date(r.updated).toLocaleDateString()}
                            </td>
                            <td>
                              <div className="row-actions">
                                <button
                                  onClick={() =>
                                    edit(
                                      module === "users"
                                        ? { ...r, password: "" }
                                        : r,
                                    )
                                  }
                                  aria-label={`Edit ${r.title || r.name}`}
                                >
                                  Edit <ArrowUpRight size={14} />
                                </button>
                                {module !== "users" &&
                                  user.role !== "team_member" && (
                                    <button
                                      className="delete-action"
                                      onClick={() => remove(r)}
                                      aria-label={`Delete ${r.title}`}
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  )}
                              </div>
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              {!busy && !list.length && (
                <div className="empty">
                  <FolderKanban size={30} />
                  <h3>A fresh start.</h3>
                  <p>
                    {query || filter
                      ? "No records match these filters."
                      : "Your records will appear here. Add your first one to get started."}
                  </p>
                </div>
              )}
              {module !== "users" && (
                <div className="pagination">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  <span>Page {page}</span>
                  <button
                    disabled={
                      module === "audit"
                        ? list.length < 50
                        : page * 20 >= (data?.total || 0)
                    }
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </section>
          )}
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {toast}
        </div>
      )}
      {editing && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget && !busy) setEditing(null);
          }}
        >
          <section
            ref={editorRef}
            className="editor-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Edit ${labels[module]}`}
          >
            <div className="modal-heading">
              <div>
                <p className="eyebrow">{labels[module]}</p>
                <h2>{editing.id ? "Edit record" : "Create something new"}</h2>
              </div>
              <button
                onClick={() => setEditing(null)}
                aria-label="Close editor"
              >
                <X />
              </button>
            </div>
            {error && (
              <p role="alert" className="error-message">
                {error}
              </p>
            )}
            <div className="editor-tools">
              {editing.id && module !== "users" && (
                <button
                  onClick={async () => {
                    try {
                      setHistory(await api(`/admin/history/${editing.id}`));
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  <History size={16} />
                  Version history
                </button>
              )}
              {schemas[module] &&
                !["clients", "enquiries", "quotations"].includes(module) && (
                  <button onClick={() => setPreview(!preview)}>
                    <Eye size={16} />
                    {preview ? "Back to editor" : "Preview draft"}
                  </button>
                )}
              {module === "quotations" && editing.id && (
                <button onClick={() => printQuote(editing)}>
                  <Download size={16} />
                  Print / save PDF
                </button>
              )}
            </div>
            {module === "quotations" && (
              <p className="form-note">
                Print or save a PDF to send through your chosen email channel.
                “Sent” records your manual action; it does not send an email.
              </p>
            )}
            {history && (
              <div className="history-panel">
                <strong>Previous versions</strong>
                {history.length ? (
                  history.map((h) => (
                    <div key={h.id}>
                      <span>
                        Version {h.version} ·{" "}
                        {new Date(h.created).toLocaleString()}
                      </span>
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              "Load this version into the editor? Save to restore it.",
                            )
                          ) {
                            setEditing({
                              ...h.data,
                              id: editing.id,
                              kind: editing.kind,
                              version: editing.version,
                              updated: editing.updated,
                            });
                            setHistory(null);
                          }
                        }}
                      >
                        Load version
                      </button>
                    </div>
                  ))
                ) : (
                  <p>No previous versions yet.</p>
                )}
              </div>
            )}
            {preview ? (
              <article className="draft-preview">
                <span className="badge">
                  Draft preview · visible to you only
                </span>
                {editing.image && <img src={editing.image} alt="" />}
                <h1>{editing.title}</h1>
                <p>{editing.subtitle}</p>
                <p className="prose-body">{editing.description}</p>
                <div className="tags">
                  {(
                    editing.technologies ||
                    editing.expertise ||
                    editing.benefits ||
                    ""
                  )
                    .split(",")
                    .map((s: string) => (
                      <span key={s}>{s}</span>
                    ))}
                </div>
              </article>
            ) : (
              <form onSubmit={save}>
                <div className="editor-grid">
                  {fields.map((f) => (
                    <FormField
                      key={f.key}
                      field={f}
                      value={editing[f.key]}
                      assignees={assignees}
                      onChange={(v) => setEditing({ ...editing, [f.key]: v })}
                    />
                  ))}
                </div>
                {module === "quotations" && editing.total && (
                  <p className="quote-total">
                    Saved total: {editing.currency} {editing.total}{" "}
                    <small>Recalculated securely when saved.</small>
                  </p>
                )}
                <div className="modal-actions">
                  <button
                    type="button"
                    className="button button-outline"
                    onClick={() => setEditing(null)}
                  >
                    Cancel
                  </button>
                  <button className="button" disabled={busy}>
                    <Save size={17} />
                    {busy ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
function ShieldIcon() {
  return (
    <span className="tip-icon">
      <Asterisk size={24} />
    </span>
  );
}
function FormField({
  field: f,
  value,
  onChange,
  assignees,
}: {
  field: Field;
  value: any;
  onChange: (v: any) => void;
  assignees: User[];
}) {
  if (f.type === "checkbox")
    return (
      <label className="checkbox editor-check">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>{f.label}</span>
      </label>
    );
  if (f.type === "items")
    return (
      <div className="field-full quote-items">
        <strong>{f.label}</strong>
        {(value || []).map((item: any, i: number) => (
          <div className="quote-item" key={i}>
            <label>
              Description
              <input
                required
                value={item.description}
                onChange={(e) =>
                  onChange(
                    value.map((x: any, n: number) =>
                      n === i ? { ...x, description: e.target.value } : x,
                    ),
                  )
                }
              />
            </label>
            <label>
              Quantity
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={item.quantity}
                onChange={(e) =>
                  onChange(
                    value.map((x: any, n: number) =>
                      n === i ? { ...x, quantity: e.target.value } : x,
                    ),
                  )
                }
              />
            </label>
            <label>
              Unit price
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={item.unitPrice}
                onChange={(e) =>
                  onChange(
                    value.map((x: any, n: number) =>
                      n === i ? { ...x, unitPrice: e.target.value } : x,
                    ),
                  )
                }
              />
            </label>
            <button
              type="button"
              disabled={value.length <= 1}
              aria-label={`Remove line ${i + 1}`}
              onClick={() =>
                onChange(value.filter((_: any, n: number) => n !== i))
              }
            >
              <X size={16} />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="text-link"
          onClick={() =>
            onChange([
              ...(value || []),
              { description: "", quantity: "1", unitPrice: "0" },
            ])
          }
        >
          <Plus size={16} />
          Add line
        </button>
      </div>
    );
  const props = {
    value: value ?? "",
    required: f.required,
    onChange: (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      onChange(f.type === "number" ? Number(e.target.value) : e.target.value),
  };
  return (
    <label className={f.type === "textarea" ? "field-full" : ""}>
      {f.label}
      {f.type === "textarea" ? (
        <textarea rows={4} {...props} />
      ) : f.type === "select" ? (
        <select {...props}>
          {f.options?.map((s) => (
            <option value={s} key={s}>
              {s.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      ) : f.type === "assignee" ? (
        <select {...props}>
          <option value="">Unassigned</option>
          {assignees.map((u) => (
            <option value={u.id} key={u.id}>
              {u.name} · {u.role.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={f.type || "text"}
          step={f.type === "number" ? "any" : undefined}
          minLength={f.type === "password" && f.required ? 12 : undefined}
          {...props}
        />
      )}
      <small className="form-note">
        {f.hint ||
          (["image", "poster", "logo", "favicon"].includes(f.key)
            ? "Upload in Media library, then paste the file path here."
            : "")}
      </small>
    </label>
  );
}
function Login({ onLogin }: { onLogin: (u: User) => void }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [setupAvailable, setSetupAvailable] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [success, setSuccess] = useState("");
  useEffect(() => {
    api("/auth/setup")
      .then((status) => setSetupAvailable(status.available))
      .catch(() => {});
  }, []);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const values = Object.fromEntries(new FormData(e.currentTarget));
      if (registering) {
        if (values.password !== values.confirmPassword) {
          throw new Error("Your passwords do not match.");
        }
        delete values.confirmPassword;
        await api("/auth/setup", "POST", values);
        e.currentTarget?.reset();
        setSetupAvailable(false);
        setRegistering(false);
        setSuccess("Your administrator account is ready. Sign in below.");
        return;
      }
      onLogin(
        await api(
          "/auth/login",
          "POST",
          Object.fromEntries(new FormData(e.currentTarget)),
        ),
      );
    } catch (e) {
      setError((e as Error).message);
      if (registering) {
        api("/auth/setup")
          .then((status) => {
            setSetupAvailable(status.available);
            if (!status.available) setRegistering(false);
          })
          .catch(() => {});
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      <section className="login-story">
        <Link href="/" className="brand">
          <span className="brand-symbol">
            <Asterisk />
          </span>
          <span>Studio.</span>
        </Link>
        <div>
          <p className="eyebrow">YOUR IDEAS. YOUR WORKSPACE.</p>
          <h1>
            Good things
            <br />
            happen here<span>.</span>
          </h1>
          <p>A little clarity for the work behind your business.</p>
        </div>
        <span>Thoughtfully designed. Purposefully built.</span>
        <Asterisk className="login-star" size={300} strokeWidth={0.5} />
      </section>
      <section className="login-form-wrap">
        <form onSubmit={submit} key={registering ? "setup" : "login"}>
          <span className="login-icon">
            <Asterisk size={30} />
          </span>
          <p className="eyebrow">WELCOME TO YOUR STUDIO</p>
          <h2>
            {registering
              ? "Register your administrator."
              : "Let’s get to work."}
          </h2>
          <p>
            {registering
              ? "Create the first administrator account. Registration closes after setup."
              : "Sign in to manage your website and conversations."}
          </p>
          {success && <p role="status">{success}</p>}
          {registering && (
            <>
              <label>
                Your name
                <input
                  name="name"
                  required
                  minLength={2}
                  maxLength={120}
                  autoComplete="name"
                />
              </label>
              <label>
                Private setup key
                <input
                  name="setupKey"
                  type="password"
                  required
                  maxLength={512}
                  autoComplete="off"
                />
              </label>
            </>
          )}
          <label>
            Email address
            <input
              type="email"
              name="email"
              required
              maxLength={200}
              autoComplete="username"
              placeholder="you@yourstudio.com"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              required
              minLength={registering ? 12 : undefined}
              maxLength={200}
              autoComplete={registering ? "new-password" : "current-password"}
              placeholder="Your password"
            />
          </label>
          {registering && (
            <label>
              Confirm password
              <input
                name="confirmPassword"
                type="password"
                required
                minLength={12}
                maxLength={200}
                autoComplete="new-password"
              />
            </label>
          )}
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}
          <button className="button" disabled={busy}>
            {busy
              ? registering
                ? "Creating account…"
                : "Signing in…"
              : registering
                ? "Create administrator account"
                : "Open my workspace"}
            <ArrowUpRight size={18} />
          </button>
          {setupAvailable && (
            <button
              type="button"
              className="text-link"
              disabled={busy}
              onClick={() => {
                setRegistering(!registering);
                setError("");
                setSuccess("");
              }}
            >
              {registering ? "Back to sign in" : "Register first administrator"}
            </button>
          )}
          <Link className="text-link" href="/">
            ← Back to website
          </Link>
        </form>
      </section>
    </main>
  );
}
function printQuote(q: any) {
  const popup = window.open("", "_blank", "width=900,height=800");
  if (!popup) return;
  // Build with textContent rather than interpolating client-supplied HTML.
  const doc = popup.document;
  doc.title = `Quotation ${q.number || ""}`;
  const style = doc.createElement("style");
  style.textContent =
    "body{font:15px system-ui;color:#102d52;max-width:800px;margin:50px auto;padding:20px}h1{font-size:36px}table{width:100%;border-collapse:collapse;margin:30px 0}td,th{text-align:left;padding:14px;border-bottom:1px solid #ddd}p{white-space:pre-wrap}.total{text-align:right;font-size:22px}button{padding:12px 20px}@media print{button{display:none}}";
  doc.head.append(style);
  function add(tag: string, text: string, parent: HTMLElement = doc.body) {
    const el = doc.createElement(tag);
    el.textContent = text;
    parent.append(el);
    return el;
  }
  add("h1", "Quotation");
  add("p", `${q.number || ""} · ${q.stage || "Draft"}`);
  add("h2", q.title);
  add(
    "p",
    `Prepared for: ${q.client || ""}\n${q.email || ""}\nValid until: ${q.validUntil || "As agreed"}`,
  );
  const table = add("table", "");
  const header = add("tr", "", table);
  ["Description", "Quantity", "Unit price", "Amount"].forEach((t) =>
    add("th", t, header),
  );
  (q.items || []).forEach((i: any) => {
    const row = add("tr", "", table);
    [i.description, i.quantity, i.unitPrice, i.amount].forEach((t) =>
      add("td", String(t || ""), row),
    );
  });
  add(
    "p",
    `Subtotal: ${q.currency} ${q.subtotal}\nTax (${q.taxPercent}%): ${q.currency} ${q.tax}`,
  );
  add("h2", `Total: ${q.currency} ${q.total}`).className = "total";
  add("p", q.notes || "");
  const button = add("button", "Print / save PDF");
  button.onclick = () => popup.print();
}
