"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  Search,
  Menu,
  X,
  CheckCircle2,
} from "lucide-react";
import { api, type Item } from "@/lib/api";

export function MobileMenu({ links }: { links: Item[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mobile-menu">
      <button
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <Menu />}
      </button>
      {open && (
        <nav aria-label="Mobile navigation">
          {links.map((l) => (
            <Link key={l.id} href={l.url} onClick={() => setOpen(false)}>
              {l.title}
            </Link>
          ))}
          <Link href="/contact" onClick={() => setOpen(false)}>
            Let’s talk <ArrowUpRight size={17} />
          </Link>
        </nav>
      )}
    </div>
  );
}
export function VisitTracker({
  path,
  enabled,
}: {
  path: string;
  enabled: boolean;
}) {
  useEffect(() => {
    if (!enabled) return;
    const key = `agency-view:${path}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
      api("/public/visit", "POST", { path }).catch(() => {});
    } catch {}
  }, [path, enabled]);
  return null;
}
export function ProjectGallery({ projects }: { projects: Item[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All work");
  const categories = [
    "All work",
    ...Array.from(new Set(projects.map((p) => p.category).filter(Boolean))),
  ];
  const filtered = projects.filter(
    (p) =>
      (category === "All work" || p.category === category) &&
      `${p.title} ${p.description} ${p.technologies}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="filter-bar">
        <div className="filter-tabs">
          {categories.map((c) => (
            <button
              className={c === category ? "selected" : ""}
              key={c}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <label className="search-box">
          <Search size={17} />
          <span className="sr-only">Search projects</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a project…"
          />
        </label>
      </div>
      <div className="project-grid">
        {filtered.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>
      {!filtered.length && (
        <div className="empty">
          No projects match your search. Try a different word or category.
        </div>
      )}
    </>
  );
}
export function ProjectCard({ project: p }: { project: Item }) {
  return (
    <Link href={`/work/${p.id}`} className="project-card">
      <div className="project-art">
        {p.image ? (
          <img src={p.image} alt={`${p.title} preview`} loading="lazy" />
        ) : (
          <div className="art-fallback">{p.category || "Digital project"}</div>
        )}
        <span className="project-arrow">
          <ArrowUpRight size={22} />
        </span>
        {p.demo && <span className="sample-tag">Illustrative concept</span>}
      </div>
      <div className="project-meta">
        <span>{p.category}</span>
        <span>{p.developmentStatus}</span>
      </div>
      <h3>{p.title}</h3>
      <p>{p.description}</p>
      <div className="tags">
        {(p.technologies || "")
          .split(",")
          .filter(Boolean)
          .map((t: string) => (
            <span key={t}>{t.trim()}</span>
          ))}
      </div>
    </Link>
  );
}
export function EnquiryForm({
  services,
  quote = false,
  initialService = "",
}: {
  services: Item[];
  quote?: boolean;
  initialService?: string;
}) {
  const [state, setState] = useState<"idle" | "sending" | "success">("idle");
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setState("sending");
    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries());
    try {
      await api("/public/enquiries", "POST", {
        ...data,
        consent: form.get("consent") === "on",
        source: quote ? "Quote request" : "Contact form",
      });
      setState("success");
    } catch (err) {
      setError((err as Error).message);
      setState("idle");
    }
  }
  if (state === "success")
    return (
      <div className="success-panel" role="status">
        <CheckCircle2 size={44} />
        <h2>You’ve made the first move.</h2>
        <p>
          Your enquiry is saved. The team can now review your requirements and
          follow up using your contact details.
        </p>
        <button className="button" onClick={() => setState("idle")}>
          Send another enquiry <ArrowRight size={17} />
        </button>
      </div>
    );
  return (
    <form onSubmit={submit} className="enquiry-form">
      <div className="two-columns">
        <label>
          Your name
          <input
            name="name"
            required
            minLength={2}
            maxLength={120}
            autoComplete="name"
            placeholder="How should we address you?"
          />
        </label>
        <label>
          Email address
          <input
            name="email"
            type="email"
            required
            maxLength={200}
            autoComplete="email"
            placeholder="you@company.com"
          />
        </label>
      </div>
      <div className="two-columns">
        <label>
          Phone number <span className="muted">(optional)</span>
          <input
            name="phone"
            type="tel"
            maxLength={40}
            autoComplete="tel"
            placeholder="+254 …"
          />
        </label>
        <label>
          What can we help with?
          <select name="service" defaultValue={initialService}>
            <option value="">Let’s figure it out together</option>
            {services.map((s) => (
              <option key={s.id}>{s.title}</option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Tell us about your project
        <textarea
          name="requirements"
          required
          minLength={15}
          maxLength={10000}
          rows={6}
          placeholder="What would you like to build or improve? Tell us about your goals, timeline and any budget you have in mind."
        />
      </label>
      <div className="honeypot" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label className="checkbox">
        <input type="checkbox" name="consent" required />
        <span>
          I agree that my details may be used to respond to this enquiry. Read
          the <Link href="/privacy">privacy policy</Link>.
        </span>
      </label>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      <button className="button" disabled={state === "sending"}>
        {state === "sending"
          ? "Sending…"
          : quote
            ? "Request a quotation"
            : "Let’s start a conversation"}
        <ArrowUpRight size={18} />
      </button>
      <p className="form-note">
        Your message goes directly to our enquiry dashboard.
      </p>
    </form>
  );
}
export function VideoPlayer({ url, title }: { url: string; title: string }) {
  let embed = "";
  try {
    const u = new URL(url);
    if (["www.youtube.com", "youtube.com", "youtu.be"].includes(u.hostname)) {
      const id =
        u.hostname === "youtu.be"
          ? u.pathname.slice(1)
          : u.searchParams.get("v") || u.pathname.split("/").pop();
      if (id && /^[\w-]{11}$/.test(id))
        embed = `https://www.youtube-nocookie.com/embed/${id}`;
    }
    if (
      ["vimeo.com", "www.vimeo.com"].includes(u.hostname) &&
      /^\/\d+$/.test(u.pathname)
    )
      embed = `https://player.vimeo.com/video${u.pathname}`;
  } catch {}
  const [play, setPlay] = useState(false);
  if (embed)
    return play ? (
      <iframe
        className="video-frame"
        title={title}
        src={embed}
        allowFullScreen
      />
    ) : (
      <button className="video-cover" onClick={() => setPlay(true)}>
        ▶{" "}
        <span>
          Load video from {embed.includes("youtube") ? "YouTube" : "Vimeo"}
        </span>
      </button>
    );
  if (/\.mp4(?:\?.*)?$/.test(url))
    return (
      <video
        className="video-frame"
        controls
        preload="none"
        src={url}
        aria-label={title}
      />
    );
  return (
    <a
      className="text-link"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      Watch video <ArrowUpRight size={17} />
    </a>
  );
}
