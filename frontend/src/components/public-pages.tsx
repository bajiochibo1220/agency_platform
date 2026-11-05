import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  Globe,
  Code2,
  PanelsTopLeft,
  Smartphone,
  Sparkles,
  ChartNoAxesCombined,
  Database,
  Network,
  Search,
  ShieldCheck,
  Check,
  MapPin,
  Mail,
  Phone,
  MoveUpRight,
  Asterisk,
} from "lucide-react";
import type { Site, Item } from "@/lib/api";
import { ContactBanner } from "./site-shell";
import { HomeCarousel } from "./home-carousel";
import {
  ProjectCard,
  ProjectGallery,
  EnquiryForm,
  VideoPlayer,
} from "./public-client";

const icons: Record<string, typeof Globe> = {
  Globe,
  Code2,
  PanelsTopLeft,
  Smartphone,
  Sparkles,
  ChartNoAxesCombined,
  Database,
  Network,
  Search,
  ShieldCheck,
};
export function ServiceCard({
  service: s,
  index = 0,
}: {
  service: Item;
  index?: number;
}) {
  const Icon = icons[s.icon] || Code2;
  return (
    <Link href={`/services/${s.id}`} className="service-card">
      <div className="service-card-top">
        <Icon size={28} strokeWidth={1.5} />
        <span>0{index + 1}</span>
      </div>
      <h3>{s.title}</h3>
      <p>{s.description}</p>
      <span className="text-link">
        Explore service <ArrowUpRight size={17} />
      </span>
    </Link>
  );
}
export function Home({ site }: { site: Site }) {
  const s = site.settings;
  return (
    <>
      <HomeCarousel settings={s} />
      <section
        className="authority-highlights"
        aria-label="Explore our capabilities"
      >
        <div className="container">
          {[
            ["Web", "Websites & digital experiences", "/services"],
            ["Apps", "Business & mobile applications", "/services"],
            ["AI", "Intelligence & automation", "/services"],
            ["Data", "Reporting & connected systems", "/solutions"],
            ["Support", "Maintenance & ongoing care", "/contact"],
          ].map(([title, label, href]) => (
            <Link href={href} key={title}>
              <strong>{title}</strong>
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </section>
      <section className="section container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">WHAT WE DO</p>
            <h2>
              Big ideas deserve
              <br />
              the right technology.
            </h2>
          </div>
          <div>
            <p>
              From a stronger online presence to a smarter way of working.
              Digital solutions with a real purpose.
            </p>
            <Link className="text-link" href="/services">
              Discover our services <ArrowUpRight size={17} />
            </Link>
          </div>
        </div>
        <div className="service-grid">
          {site.services.slice(0, 3).map((service: Item, i: number) => (
            <ServiceCard service={service} index={i} key={service.id} />
          ))}
        </div>
      </section>
      <section className="work-section section">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">POSSIBILITIES, MADE VISIBLE</p>
              <h2>A little of what’s possible.</h2>
            </div>
            <Link className="text-link" href="/work">
              Explore all work <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="project-grid">
            {site.projects
              .filter((p: Item) => p.featured)
              .slice(0, 3)
              .map((p: Item) => (
                <ProjectCard project={p} key={p.id} />
              ))}
          </div>
        </div>
      </section>
      <section className="section container approach-section">
        <div>
          <p className="eyebrow">A PARTNER, FROM THE FIRST CONVERSATION</p>
          <h2>
            Good technology.
            <br />
            Even better teamwork.
          </h2>
          <p className="section-intro">{s.about}</p>
          <Link className="text-link" href="/about">
            Get to know us <ArrowUpRight size={18} />
          </Link>
          <div className="studio-stamp">
            <Asterisk size={45} strokeWidth={1.5} />
            <div>
              BASED IN {s.location.toUpperCase()}.
              <br />
              <strong>Built for wherever you’re headed.</strong>
            </div>
          </div>
        </div>
        <div className="process-list">
          {site.sections
            .filter((r: Item) => r.page === "home" && r.position === "process")
            .map((r: Item) => (
              <div key={r.id}>
                <span>{r.subtitle}</span>
                <article>
                  <h3>{r.title}</h3>
                  <p>{r.description}</p>
                </article>
                <ArrowUpRight size={20} />
              </div>
            ))}
        </div>
      </section>
      {site.sections
        .filter((r: Item) => r.page === "home" && r.position !== "process")
        .map((r: Item) => (
          <section className="section container prose" key={r.id}>
            <p className="eyebrow">{r.subtitle}</p>
            <h2>{r.title}</h2>
            <p>{r.description}</p>
            {r.image && <img src={r.image} alt={r.title} loading="lazy" />}
            {r.url && (
              <Link className="text-link" href={r.url}>
                Learn more ↗
              </Link>
            )}
          </section>
        ))}
      {site.testimonials.length > 0 && (
        <section className="section container">
          <p className="eyebrow">IN OUR CLIENTS’ WORDS</p>
          <div className="service-grid">
            {site.testimonials.map((t: Item) => (
              <blockquote className="service-card" key={t.id}>
                <p>“{t.description}”</p>
                <strong>{t.client}</strong>
                <small>
                  {t.role} · {t.company}
                </small>
              </blockquote>
            ))}
          </div>
        </section>
      )}
      <ContactBanner settings={s} />
    </>
  );
}
export function PageIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="page-intro container">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
  );
}
export function PublicPage({
  site,
  slug,
  service,
}: {
  site: Site;
  slug: string;
  service?: string;
}) {
  if (slug === "services")
    return (
      <>
        <PageIntro
          eyebrow="WHAT WE DO"
          title="The right tools. New possibilities."
          description="Digital solutions that connect your ambition with the people, processes and opportunities that matter."
        />
        <section className="container section no-top">
          <div className="service-grid">
            {site.services.map((s: Item, i: number) => (
              <ServiceCard service={s} index={i} key={s.id} />
            ))}
          </div>
        </section>
        <ContactBanner settings={site.settings} />
      </>
    );
  if (slug === "work")
    return (
      <>
        <PageIntro
          eyebrow="OUR WORK & EXPLORATIONS"
          title="Ideas you can see. Possibilities you can explore."
          description="Browse our projects and illustrative concepts. Every project clearly identifies its current development status."
        />
        <section className="container section no-top">
          <ProjectGallery projects={site.projects} />
        </section>
        <ContactBanner settings={site.settings} />
      </>
    );
  if (slug === "team")
    return (
      <>
        <PageIntro
          eyebrow="THE PEOPLE BEHIND THE POSSIBILITIES"
          title="Different strengths. Shared purpose."
          description="Meet the people who bring ideas, care and practical expertise to every project."
        />
        <section className="section container no-top">
          <div className="team-grid">
            {site.team.map((p: Item, i: number) => (
              <article className="team-card" key={p.id}>
                <div className={`team-photo tone-${i % 3}`}>
                  {p.image ? (
                    <img src={p.image} alt={p.title} loading="lazy" />
                  ) : (
                    <Asterisk size={110} strokeWidth={1} />
                  )}
                  <span>{p.demo ? "Sample profile" : p.role}</span>
                </div>
                <h3>{p.title}</h3>
                <p className="team-role">{p.role}</p>
                <p>{p.description}</p>
                <div className="tags">
                  {(p.expertise || "")
                    .split(",")
                    .filter(Boolean)
                    .map((t: string) => (
                      <span key={t}>{t.trim()}</span>
                    ))}
                </div>
                {p.url && (
                  <a
                    className="text-link"
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View portfolio ↗
                  </a>
                )}
                {p.video && (
                  <VideoPlayer
                    url={p.video}
                    title={`${p.title} introduction`}
                  />
                )}
              </article>
            ))}
          </div>
        </section>
        <ContactBanner settings={site.settings} />
      </>
    );
  if (slug === "videos")
    return (
      <>
        <PageIntro
          eyebrow="WATCH & EXPLORE"
          title="See the thinking. Meet the people."
          description="Product demonstrations, project walkthroughs and conversations from the studio."
        />
        <section className="container section no-top">
          {site.videos.length ? (
            <div className="video-grid">
              {site.videos.map((v: Item) => (
                <article className="video-card" key={v.id}>
                  <VideoPlayer url={v.url} title={v.title} />
                  <p className="eyebrow">{v.category}</p>
                  <h3>{v.title}</h3>
                  <p>{v.description}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty">
              <Sparkles size={32} />
              <h2>Something worth watching is on its way.</h2>
              <p>
                We’ll share demonstrations and studio introductions here. For
                now, explore our work or tell us about your idea.
              </p>
              <Link className="text-link" href="/work">
                Explore our work <ArrowUpRight size={17} />
              </Link>
            </div>
          )}
        </section>
      </>
    );
  if (slug === "contact" || slug === "quote") {
    const s = site.settings;
    return (
      <>
        <PageIntro
          eyebrow={
            slug === "quote" ? "LET’S MAKE IT REAL" : "HELLO, NEW POSSIBILITIES"
          }
          title={
            slug === "quote"
              ? "Your next chapter starts here."
              : "Good things start with a conversation."
          }
          description="Tell us what you have in mind. We’ll help you find a practical way forward."
        />
        <section className="container section no-top contact-grid">
          <aside className="contact-details">
            <h3>Let’s connect.</h3>
            <p>
              Start with a question, a challenge or an idea. You don’t need to
              have it all figured out.
            </p>
            {s.email && (
              <a href={`mailto:${s.email}`}>
                <Mail size={20} />
                <span>
                  <small>EMAIL US</small>
                  {s.email}
                </span>
              </a>
            )}
            {s.phone && (
              <a href={`tel:${s.phone}`}>
                <Phone size={20} />
                <span>
                  <small>CALL US</small>
                  {s.phone}
                </span>
              </a>
            )}
            <div>
              <MapPin size={20} />
              <span>
                <small>FIND US</small>
                {s.location}
              </span>
            </div>
            <p className="contact-hours">{s.hours}</p>
            {s.whatsapp && (
              <a
                className="button button-outline"
                href={`https://wa.me/${s.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Chat on WhatsApp <ArrowUpRight size={17} />
              </a>
            )}
            <div className="contact-note">
              <Asterisk size={30} />
              <p>
                Prefer a consultation? Include a few suitable dates and times in
                your message.
              </p>
            </div>
          </aside>
          <EnquiryForm
            services={site.services}
            quote={slug === "quote"}
            initialService={service}
          />
        </section>
      </>
    );
  }
  const page = site.pages.find((p: Item) => p.slug === slug);
  return (
    <>
      <PageIntro
        eyebrow={slug === "about" ? "OUR STUDIO" : "FROM THE STUDIO"}
        title={page.title}
      />
      <section className="container section no-top prose">
        <div className="prose-body">{page.description}</div>
        {site.sections
          .filter((r: Item) => r.page === slug)
          .map((r: Item) => (
            <article key={r.id}>
              <p className="eyebrow">{r.subtitle}</p>
              <h2>{r.title}</h2>
              <p>{r.description}</p>
              {r.image && <img src={r.image} alt={r.title} />}
            </article>
          ))}
      </section>
      {!["privacy", "terms"].includes(slug) && (
        <ContactBanner settings={site.settings} />
      )}
    </>
  );
}
export function Detail({
  item: p,
  type,
  site,
}: {
  item: Item;
  type: "services" | "projects";
  site: Site;
}) {
  return (
    <>
      <div className="container detail-breadcrumb">
        <Link href={type === "projects" ? "/work" : "/services"}>
          ← Back to {type === "projects" ? "work" : "services"}
        </Link>
      </div>
      <PageIntro
        eyebrow={
          type === "projects"
            ? `${p.category} · ${p.developmentStatus}`
            : "WHAT WE DO"
        }
        title={p.title}
        description={p.subtitle || p.description}
      />
      <section className="container section no-top detail-grid">
        <article className="prose">
          {p.demo && (
            <p className="demo-banner">
              Illustrative concept · This is a demonstration, not delivered
              client work.
            </p>
          )}
          {p.image && (
            <img className="detail-image" src={p.image} alt={p.title} />
          )}
          <h2>
            {type === "projects" ? "The idea" : "Built around your goals"}
          </h2>
          <p>{p.description}</p>
          {p.problem && (
            <>
              <h3>The business challenge</h3>
              <p>{p.problem}</p>
            </>
          )}
          {(p.functionality || p.benefits) && (
            <>
              <h3>
                {type === "projects"
                  ? "Key functionality"
                  : "What we can help with"}
              </h3>
              <ul>
                {(p.functionality || p.benefits).split(",").map((t: string) => (
                  <li key={t}>{t.trim()}</li>
                ))}
              </ul>
            </>
          )}
          {p.gallery &&
            p.gallery
              .split("\n")
              .filter(Boolean)
              .map((src: string) => (
                <img
                  className="detail-image"
                  src={src}
                  alt={`${p.title} screenshot`}
                  key={src}
                  loading="lazy"
                />
              ))}
          {p.video && <VideoPlayer url={p.video} title={p.title} />}
        </article>
        <aside className="detail-sidebar">
          <h3>At a glance</h3>
          {p.client && (
            <p>
              <small>CLIENT / ORGANIZATION</small>
              {p.client}
            </p>
          )}
          {p.developmentStatus && (
            <p>
              <small>DEVELOPMENT STATUS</small>
              {p.developmentStatus}
            </p>
          )}
          {p.technologies && (
            <p>
              <small>TECHNOLOGIES</small>
              {p.technologies}
            </p>
          )}
          {p.price && (
            <p>
              <small>PRICING</small>
              {p.price}
            </p>
          )}
          {p.services && (
            <p>
              <small>RELATED SERVICES</small>
              {p.services}
            </p>
          )}
          {p.liveUrl && (
            <a
              className="text-link"
              href={p.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit live project ↗
            </a>
          )}
          {p.sourceUrl && (
            <a
              className="text-link"
              href={p.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              View source ↗
            </a>
          )}
          <Link
            className="button"
            href={`/quote?service=${encodeURIComponent(p.title)}`}
          >
            {type === "projects"
              ? "Build something similar"
              : "Discuss your project"}
            <ArrowUpRight size={17} />
          </Link>
        </aside>
      </section>
      <ContactBanner settings={site.settings} />
    </>
  );
}
