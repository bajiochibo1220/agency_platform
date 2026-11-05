import Link from "next/link";
import { ArrowUpRight, Asterisk, MapPin } from "lucide-react";
import type { Site, Item } from "@/lib/api";
import { MobileMenu, VisitTracker } from "./public-client";
import type { CSSProperties } from "react";

export function Brand({ settings: s }: { settings: Site["settings"] }) {
  return (
    <Link href="/" className="brand">
      {s.logo ? (
        <img src={s.logo} alt="" />
      ) : (
        <span className="brand-symbol">
          <Asterisk size={26} strokeWidth={2.7} />
        </span>
      )}
      <span>
        {s.name}
        <span className="brand-dot">.</span>
      </span>
    </Link>
  );
}
export function SiteShell({
  site,
  children,
  path = "/",
}: {
  site: Site;
  children: React.ReactNode;
  path?: string;
}) {
  const s = site.settings;
  const links = site.navigation.filter((n: Item) => n.placement !== "footer");
  const style = {
    "--primary": s.primary,
    "--accent": s.accent,
    "--page-bg": s.background,
    fontFamily: s.font === "serif" ? "Georgia, serif" : undefined,
  } as CSSProperties;
  return (
    <div className={`site layout-${s.layout}`} style={style}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <VisitTracker path={path} enabled={s.analyticsEnabled} />
      <header className="site-header">
        <div className="container header-inner">
          <Brand settings={s} />
          <nav className="desktop-nav" aria-label="Main navigation">
            {links.map((n: Item) => (
              <Link
                aria-current={path === n.url ? "page" : undefined}
                key={n.id}
                href={n.url}
              >
                {n.title}
              </Link>
            ))}
          </nav>
          <Link href="/contact" className="button nav-cta">
            Let’s talk <ArrowUpRight size={17} />
          </Link>
          <MobileMenu links={links} />
        </div>
        <Link
          className="admin-access-dot"
          href="/admin"
          aria-label="Admin sign in"
          title="Admin sign in"
        >
          <span aria-hidden="true">.</span>
        </Link>
      </header>
      <main id="main">{children}</main>
      <footer className="site-footer">
        <div className="container">
          <div className="footer-top">
            <div>
              <Brand settings={s} />
              <p>{s.footer}</p>
              <span className="location">
                <MapPin size={15} />
                {s.location}
              </span>
            </div>
            <div>
              <h4>Explore</h4>
              <Link href="/services">Services</Link>
              <Link href="/work">Selected work</Link>
              <Link href="/about">Our studio</Link>
              <Link href="/team">The team</Link>
              <Link href="/videos">Video gallery</Link>
            </div>
            <div>
              <h4>Get in touch</h4>
              {s.email && <a href={`mailto:${s.email}`}>{s.email}</a>}
              {s.phone && <a href={`tel:${s.phone}`}>{s.phone}</a>}
              <Link href="/quote">Request a quote ↗</Link>
              <Link href="/contact">Contact & consultations</Link>
              {s.socialLinkedin && (
                <a
                  href={s.socialLinkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn ↗
                </a>
              )}
              {s.socialInstagram && (
                <a
                  href={s.socialInstagram}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Instagram ↗
                </a>
              )}
              {s.socialGithub && (
                <a
                  href={s.socialGithub}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub ↗
                </a>
              )}
            </div>
          </div>
          {site.navigation
            .filter((n: Item) => n.placement === "footer")
            .map((n: Item) => (
              <Link className="extra-footer" href={n.url} key={n.id}>
                {n.title}
              </Link>
            ))}
          <div className="footer-bottom">
            <span>
              © {new Date().getFullYear()} {s.name}. All rights reserved.
            </span>
            <div>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
            </div>
          </div>
          {s.notice && <p className="demo-notice">{s.notice}</p>}
        </div>
      </footer>
      {s.whatsapp && (
        <a
          className="whatsapp"
          href={`https://wa.me/${s.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
        >
          WhatsApp <ArrowUpRight size={16} />
        </a>
      )}
    </div>
  );
}
export function ContactBanner({ settings: s }: { settings: Site["settings"] }) {
  return (
    <section className="contact-banner container">
      <div>
        <p className="eyebrow">GOOD THINGS START WITH A CONVERSATION</p>
        <h2>{s.consultation}</h2>
        <p>{s.consultationBody}</p>
      </div>
      <Link href="/quote" className="button">
        Let’s build something <ArrowUpRight size={20} />
      </Link>
      <Asterisk className="banner-asterisk" strokeWidth={1} />
    </section>
  );
}
