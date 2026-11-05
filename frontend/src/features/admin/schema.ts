export type Field = {
  key: string;
  label: string;
  type?: string;
  options?: string[];
  required?: boolean;
  hint?: string;
};
const field = (
  key: string,
  label: string,
  type = "text",
  options?: string[],
): Field => ({ key, label, type, options });
const title: Field = { key: "title", label: "Title / name", required: true };
const description = field("description", "Description", "textarea");
const publication = [
  field("status", "Publication status", "select", [
    "draft",
    "published",
    "archived",
  ]),
  field("order", "Display order", "number"),
];
const image = field("image", "Image URL / media path");
const assigned = field("assignedTo", "Assigned to", "assignee");
export const stages = [
  "New",
  "Contacted",
  "Consultation Scheduled",
  "Quotation Sent",
  "Negotiating",
  "Won",
  "Lost",
];
export const schemas: Record<string, Field[]> = {
  services: [
    title,
    field("subtitle", "Short introduction"),
    description,
    field("icon", "Icon", "select", [
      "Globe",
      "PanelsTopLeft",
      "Code2",
      "Smartphone",
      "Sparkles",
      "ChartNoAxesCombined",
      "Database",
      "Network",
      "Search",
      "ShieldCheck",
    ]),
    field("benefits", "Benefits (comma separated)"),
    field("price", "Optional pricing"),
    image,
    ...publication,
  ],
  projects: [
    title,
    field("category", "Category"),
    description,
    field("problem", "Business problem", "textarea"),
    field("functionality", "Key functionality (comma separated)"),
    field("technologies", "Technologies (comma separated)"),
    field("developmentStatus", "Development status", "select", [
      "Concept",
      "Prototype",
      "Ongoing",
      "Completed",
      "Deployed",
    ]),
    image,
    field("gallery", "Additional screenshot URLs (one per line)", "textarea"),
    field("video", "Video URL"),
    field("liveUrl", "Live application URL"),
    field("sourceUrl", "Source code URL"),
    field("client", "Authorized client / organization name"),
    field("services", "Related services"),
    field("featured", "Featured on homepage", "checkbox"),
    field("demo", "Illustrative / demo project", "checkbox"),
    ...publication,
  ],
  team: [
    title,
    field("role", "Professional role"),
    description,
    field("expertise", "Expertise (comma separated)"),
    image,
    field("url", "Portfolio URL"),
    field("video", "Introduction video URL"),
    field("userId", "Profile owner", "assignee"),
    field("demo", "Sample profile", "checkbox"),
    ...publication,
  ],
  videos: [
    title,
    description,
    field("category", "Category"),
    field("url", "MP4, YouTube or Vimeo URL"),
    field("poster", "Poster image URL"),
    ...publication,
  ],
  testimonials: [
    title,
    description,
    field("client", "Client name"),
    field("role", "Client role"),
    field("company", "Company"),
    image,
    field(
      "approved",
      "Genuine feedback with permission to publish",
      "checkbox",
    ),
    ...publication,
  ],
  pages: [
    title,
    {
      key: "slug",
      label: "URL slug",
      required: true,
      hint: "Lowercase letters, numbers and hyphens. For example: our-story",
    },
    description,
    field("seoTitle", "SEO title"),
    field("seoDescription", "SEO description", "textarea"),
    ...publication,
  ],
  sections: [
    title,
    field("subtitle", "Eyebrow / step number"),
    description,
    field("page", "Page slug (home, about, or another page)"),
    field("position", "Placement", "select", ["process", "content"]),
    image,
    field("url", "Optional link"),
    ...publication,
  ],
  navigation: [
    title,
    field("url", "Link destination"),
    field("placement", "Menu location", "select", ["header", "footer"]),
    ...publication,
  ],
  enquiries: [
    title,
    field("name", "Contact name"),
    field("email", "Email", "email"),
    field("phone", "Phone"),
    field("service", "Requested service"),
    field("requirements", "Requirements", "textarea"),
    field("source", "Source"),
    assigned,
    field("priority", "Priority", "select", ["Normal", "High", "Urgent"]),
    field("stage", "Pipeline stage", "select", stages),
    field("followUp", "Follow-up date", "date"),
    field("notes", "Follow-up and communication notes", "textarea"),
  ],
  clients: [
    title,
    field("company", "Company"),
    field("email", "Email", "email"),
    field("phone", "Phone"),
    assigned,
    field("notes", "Interaction history / notes", "textarea"),
  ],
  quotations: [
    title,
    field("client", "Client / organization"),
    field("email", "Client email", "email"),
    field("enquiryId", "Related enquiry ID"),
    assigned,
    field("items", "Line items", "items"),
    field("taxPercent", "Tax percentage", "number"),
    field("currency", "Currency", "select", ["KES", "USD", "EUR", "GBP"]),
    field("validUntil", "Valid until", "date"),
    field("stage", "Quotation status", "select", [
      "Draft",
      "Sent",
      "Accepted",
      "Declined",
      "Expired",
    ]),
    field("notes", "Terms / notes", "textarea"),
  ],
};
export const settingsGroups: Record<string, Field[]> = {
  "Brand & homepage": [
    field("name", "Brand name"),
    field("slogan", "Slogan"),
    field("logo", "Logo URL / uploaded media path"),
    field("favicon", "Favicon URL / uploaded media path"),
    field("eyebrow", "Hero eyebrow"),
    field("headline", "Hero heading (one line per row)", "textarea"),
    field("description", "Hero description", "textarea"),
    field("about", "About the studio", "textarea"),
    field("footer", "Footer message"),
    field("notice", "Site notice / demo disclosure", "textarea"),
    field("consultation", "Contact banner heading"),
    field("consultationBody", "Contact banner description", "textarea"),
  ],
  "Theme & appearance": [
    field("primary", "Deep / primary color", "color"),
    field("accent", "Accent / action color", "color"),
    field("background", "Page background", "color"),
    field("font", "Typography", "select", ["sans", "serif"]),
    field("layout", "Spacing", "select", ["comfortable", "compact"]),
  ],
  "Contact & social": [
    field("email", "Public email", "email"),
    field("phone", "Public phone"),
    field("whatsapp", "WhatsApp (international digits, no +)"),
    field("location", "Business location"),
    field("hours", "Business hours"),
    field("socialLinkedin", "LinkedIn URL"),
    field("socialInstagram", "Instagram URL"),
    field("socialGithub", "GitHub URL"),
  ],
  "SEO & system": [
    field("seoTitle", "Default SEO title"),
    field("seoDescription", "Default SEO description", "textarea"),
    field("analyticsEnabled", "Enable aggregate page analytics", "checkbox"),
  ],
};
export const labels: Record<string, string> = {
  overview: "Overview",
  settings: "Brand & settings",
  pages: "Pages",
  sections: "Page sections",
  services: "Services",
  projects: "Portfolio",
  team: "Team",
  videos: "Videos",
  media: "Media library",
  testimonials: "Testimonials",
  enquiries: "Enquiries",
  quotations: "Quotations",
  clients: "Clients",
  navigation: "Navigation",
  analytics: "Analytics",
  users: "Users & permissions",
  audit: "Audit log",
};
export const modules = Object.keys(labels);
export function allowed(role: string, kind: string) {
  if (role === "super_admin") return true;
  if (role === "administrator")
    return !["users", "settings", "audit"].includes(kind);
  if (role === "content_manager")
    return [
      "overview",
      "pages",
      "sections",
      "services",
      "projects",
      "team",
      "videos",
      "media",
      "testimonials",
      "navigation",
    ].includes(kind);
  if (role === "sales")
    return ["overview", "enquiries", "quotations", "clients"].includes(kind);
  return ["overview", "team"].includes(kind);
}
export function defaults(kind: string): Record<string, any> {
  const result: Record<string, any> = {};
  for (const f of schemas[kind] || [])
    result[f.key] =
      f.type === "checkbox"
        ? false
        : f.type === "number"
          ? 0
          : f.type === "items"
            ? [{ description: "", quantity: "1", unitPrice: "0" }]
            : f.options?.[0] || "";
  if (kind === "sections") result.page = "home";
  return result;
}
