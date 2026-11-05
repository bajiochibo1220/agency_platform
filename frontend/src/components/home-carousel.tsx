"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { Site } from "@/lib/api";

export function HomeCarousel({ settings: s }: { settings: Site["settings"] }) {
  const [active, setActive] = useState(0);
  const slides = [
    {
      title: s.headline.replaceAll("\n", " "),
      description: s.description,
      label: s.eyebrow,
      href: "/work",
      action: "Explore our work",
    },
    {
      title: "Digital solutions that move your business forward.",
      description:
        "From business websites to connected applications, discover technology built around the way you work.",
      label: "OUR SERVICES",
      href: "/services",
      action: "Discover our services",
    },
    {
      title: "Your next chapter starts with a conversation.",
      description: s.consultationBody,
      label: "LET’S BUILD TOGETHER",
      href: "/quote",
      action: "Request a quote",
    },
  ];
  const slide = slides[active];
  const move = (direction: number) =>
    setActive((active + direction + slides.length) % slides.length);
  return (
    <section
      className={`authority-hero slide-${active}`}
      aria-label="Featured highlights"
      aria-roledescription="carousel"
    >
      <img
        className="authority-hero-image"
        src="/agency-collaboration.jpg"
        alt=""
        fetchPriority="high"
      />
      <div className="authority-hero-shade" />
      <div className="container authority-hero-inner">
        <div className="authority-slide" aria-live="polite" aria-atomic="true">
          <p className="authority-kicker">
            <span />
            {slide.label}
          </p>
          <h1>{slide.title}</h1>
          <p className="authority-description">{slide.description}</p>
          <div className="authority-actions">
            <Link href={slide.href} className="button">
              {slide.action}
              <ArrowRight size={19} />
            </Link>
            <Link href="/about" className="authority-secondary">
              Who we are <ArrowRight size={17} />
            </Link>
          </div>
        </div>
        <div className="authority-carousel-controls">
          <div className="authority-slide-tabs" aria-label="Choose a highlight">
            {slides.map((item, i) => (
              <button
                key={item.href}
                aria-label={`Show highlight ${i + 1}: ${item.action}`}
                aria-pressed={active === i}
                onClick={() => setActive(i)}
              >
                <span />
              </button>
            ))}
          </div>
          <div className="authority-arrows">
            <button onClick={() => move(-1)} aria-label="Previous highlight">
              <ChevronLeft />
            </button>
            <button onClick={() => move(1)} aria-label="Next highlight">
              <ChevronRight />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
