'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import Animatedheader, { type HeaderTheme } from "@/components/Animatedheader";
import { MegaFooter } from "@/components/MegaFooter";
import { useTheme } from "@/components/ThemeProvider";
import styles from "./documentation.module.css";
import { documentationSections } from "./documentation-content";

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

const docsHeaderTheme: HeaderTheme = {
  light: {
    bgInitial: "#efe3d3",
    bgScrolled: "#4b3f34",
    textInitial: "#3d3227",
    textScrolled: "#ffffff",
  },
  dark: {
    bgInitial: "#271f19",
    bgScrolled: "#110d0a",
    textInitial: "#f3e9dc",
    textScrolled: "#ffffff",
  },
};

const heroChips = [
  "Technical docs",
  "Architecture-first",
  "Role workflows",
  "API and DB reference",
  "Ops readiness",
];

export default function DocumentationClient() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const mainRef = useRef<HTMLElement>(null);
  const [activeSection, setActiveSection] = useState(documentationSections[0]?.id ?? "snapshot");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateActiveSection = () => {
      const offset = 170;
      const scrollY = window.scrollY + offset;
      let current = documentationSections[0]?.id ?? "snapshot";

      for (const section of documentationSections) {
        const element = document.getElementById(section.id);
        if (element instanceof HTMLElement && scrollY >= element.offsetTop) {
          current = section.id;
        }
      }

      setActiveSection((previous) => (previous === current ? previous : current));
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, []);

  useGSAP(
    () => {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReducedMotion) return;

      gsap.fromTo(
        `.${styles.docSection}`,
        { opacity: 0, y: 18 },
        {
          opacity: 1,
          y: 0,
          duration: 0.55,
          stagger: 0.06,
          ease: "power2.out",
        }
      );
    },
    { scope: mainRef }
  );

  const handlePrint = () => {
    if (typeof window === "undefined") return;
    window.requestAnimationFrame(() => {
      window.print();
    });
  };

  return (
    <main
      ref={mainRef}
      className={`${styles.page} ${isDark ? styles.dark : styles.light}`}
    >
      <a href="#docs-main" className={styles.skipLink}>
        Skip to main content
      </a>

      <div className={styles.printHidden}>
        <Animatedheader themeColors={docsHeaderTheme} />
      </div>

      <section className={styles.hero}>
        <div className={styles.container}>
          <p className={styles.heroEyebrow}>JanSamadhan platform documentation</p>
          <h1 className={styles.heroTitle}>Professional documentation for product, engineering, and operations teams.</h1>
          <p className={styles.heroLead}>
            This page consolidates system intent, architecture, lifecycle guarantees, and operational behavior in
            one readable reference. It is designed for high scanning speed while preserving technical depth.
          </p>

          <div className={styles.heroChips}>
            {heroChips.map((chip) => (
              <span key={chip} className={styles.heroChip}>{chip}</span>
            ))}
          </div>

          <nav className={`${styles.mobileToc} ${styles.printHidden}`} aria-label="Documentation sections">
            <div className={styles.mobileTocInner}>
              {documentationSections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className={`${styles.mobileTocLink} ${activeSection === section.id ? styles.mobileTocLinkActive : ""}`}
                  onClick={() => setActiveSection(section.id)}
                >
                  {section.label} {section.title}
                </a>
              ))}
            </div>
          </nav>
        </div>
      </section>

      <div className={styles.container}>
        <div className={styles.layout}>
          <aside className={`${styles.sidebar} ${styles.printHidden}`}>
            <p className={styles.sidebarLabel}>Contents</p>
            <nav className={styles.sidebarNav} aria-label="Documentation table of contents">
              {documentationSections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className={`${styles.sidebarLink} ${activeSection === section.id ? styles.sidebarLinkActive : ""}`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <span className={styles.sidebarIndex}>{section.label}</span>
                  <span className={styles.sidebarText}>{section.title}</span>
                </a>
              ))}
            </nav>
            <div className={styles.sidebarActions}>
              <button type="button" className={styles.printButton} onClick={handlePrint}>Print or save PDF</button>
            </div>
          </aside>

          <div id="docs-main" className={styles.content}>
            {documentationSections.map((section) => (
              <section key={section.id} id={section.id} className={styles.docSection}>
                <header className={styles.sectionHead}>
                  <span className={styles.sectionLabel}>{section.label}</span>
                  <h2 className={styles.sectionTitle}>{section.title}</h2>
                  <p className={styles.sectionSummary}>{section.summary}</p>
                </header>
                <div className={styles.sectionBody}>{section.content}</div>
              </section>
            ))}
          </div>
        </div>
      </div>

      <MegaFooter
        brandColor={isDark ? "#ffffff" : "#111111"}
        brandColorDark="#ffffff"
        brandName="JanSamadhan"
        tagline="Civic complaint intelligence with accountable resolution workflows."
        socialLinks={[
          { platform: "github", href: "https://github.com/Medhansh-741/ps-crm" },
          { platform: "twitter", href: "https://twitter.com" },
          { platform: "linkedin", href: "https://linkedin.com" },
        ]}
        showNewsletter={true}
        newsletterTitle="Documentation updates"
      />
    </main>
  );
}
