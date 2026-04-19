"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Animatedheader, { type HeaderTheme } from "@/components/Animatedheader";
import { MegaFooter } from "@/components/MegaFooter";
import { useTheme } from "@/components/ThemeProvider";
import styles from "./quotation.module.css";
import {
  getQuotationSections,
  quotationHero,
  quotationHeroChips,
} from "./quotation-content";
import {
  formatInrCompact,
  getComplaintsPerYear,
  getInfraMonthlyCost,
  getInfraPerGrievance,
} from "./quotation-pricing";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

const quotationHeaderTheme: HeaderTheme = {
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

const PRINT_ANIMATED_SELECTORS = [
  "[data-hero-kicker]",
  "[data-hero-title]",
  "[data-hero-sub]",
  "[data-hero-chip]",
  "[data-hero-status]",
  "[data-metric]",
  "[data-reveal]",
  "[data-scale-card]",
].join(", ");

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

function zoneLabel(wards: number): string {
  if (wards === 1) return "single ward";
  if (wards <= 5) return "sub-zone cluster";
  if (wards <= 15) return "part of a zone";
  if (wards <= 30) return "≈ 1–2 zones";
  if (wards <= 80) return "several zones";
  if (wards <= 180) return "most of Delhi";
  return "all of Delhi";
}

export default function QuotationClient() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const rootRef = useRef<HTMLElement>(null);
  const printPreparedRef = useRef(false);
  const printSnapshotsRef = useRef<Array<{ element: HTMLElement; style: string | null }>>([]);
  const [wardCount, setWardCount] = useState(1);
  const handleWardCountChange = useCallback((value: number) => {
    setWardCount(value);
  }, []);

  const monthlyCost = useMemo(() => getInfraMonthlyCost(wardCount), [wardCount]);
  const annualCost = monthlyCost * 12;
  const yearlyComplaints = useMemo(() => getComplaintsPerYear(wardCount), [wardCount]);
  const perGrievance = useMemo(() => getInfraPerGrievance(wardCount).toFixed(2), [wardCount]);
  const scaleZone = zoneLabel(wardCount);

  const sections = useMemo(
    () =>
      getQuotationSections({
        wardCount,
        onWardCountChange: handleWardCountChange,
        zoneContext: scaleZone,
        monthlyCost: formatInrCompact(monthlyCost),
        annualCost: formatInrCompact(annualCost),
        yearlyComplaints: `${Math.round(yearlyComplaints / 1000).toLocaleString("en-IN")}K`,
        perGrievance: `₹${perGrievance}`,
      }),
    [annualCost, handleWardCountChange, monthlyCost, perGrievance, scaleZone, wardCount, yearlyComplaints]
  );

  const [activeSection, setActiveSection] = useState(sections[0]?.id ?? "basics");

  const primePrintState = useCallback(() => {
    if (typeof window === "undefined") return;

    const root = rootRef.current;
    if (!root || printPreparedRef.current) return;

    const elements = Array.from(new Set(root.querySelectorAll<HTMLElement>(PRINT_ANIMATED_SELECTORS)));

    printPreparedRef.current = true;
    printSnapshotsRef.current = elements.map((element) => ({
      element,
      style: element.getAttribute("style"),
    }));

    root.classList.add(styles.printExport);

    if (elements.length === 0) return;

    gsap.killTweensOf(elements);
    gsap.set(elements, {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      rotate: 0,
      rotateX: 0,
      rotateY: 0,
      filter: "none",
      visibility: "visible",
    });
  }, []);

  const restorePrintState = useCallback(() => {
    const root = rootRef.current;
    if (root) {
      root.classList.remove(styles.printExport);
    }

    if (!printPreparedRef.current) return;

    for (const snapshot of printSnapshotsRef.current) {
      if (snapshot.style === null) {
        snapshot.element.removeAttribute("style");
      } else {
        snapshot.element.setAttribute("style", snapshot.style);
      }
    }

    printSnapshotsRef.current = [];
    printPreparedRef.current = false;

    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => ScrollTrigger.refresh());
    }
  }, []);

  const prepareForPrint = useCallback(async () => {
    if (typeof window === "undefined") return;

    primePrintState();

    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => resolve());
      });
    });
  }, [primePrintState]);

  const handlePrint = useCallback(async () => {
    if (typeof window === "undefined") return;

    await prepareForPrint();
    window.requestAnimationFrame(() => {
      window.print();
    });
  }, [prepareForPrint]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBeforePrint = () => {
      primePrintState();
    };

    const handleAfterPrint = () => {
      restorePrintState();
    };

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
      restorePrintState();
    };
  }, [primePrintState, restorePrintState]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateActiveSection = () => {
      const offset = 170;
      const scrollY = window.scrollY + offset;
      let current = sections[0]?.id ?? "basics";

      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element instanceof HTMLElement && scrollY >= element.offsetTop) {
          current = section.id;
        }
      }

      setActiveSection((prev) => (prev === current ? prev : current));
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, [sections]);

  useGSAP(
    () => {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReducedMotion) return;

      const heroTimeline = gsap.timeline();
      heroTimeline
        .fromTo(
          "[data-hero-kicker]",
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" }
        )
        .fromTo(
          "[data-hero-title]",
          { opacity: 0, y: 32, scale: 0.98 },
          { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power3.out" },
          "-=0.2"
        )
        .fromTo(
          "[data-hero-sub]",
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
          "-=0.35"
        )
        .fromTo(
          "[data-hero-chip]",
          { opacity: 0, y: 16, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.05, ease: "power2.out" },
          "-=0.25"
        )
        .fromTo(
          "[data-hero-status]",
          { opacity: 0, x: 20 },
          { opacity: 1, x: 0, duration: 0.5, ease: "power3.out" },
          "-=0.45"
        );

      gsap.fromTo(
        "[data-metric]",
        { opacity: 0, y: 24, rotateX: 7 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 0.7,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: {
            trigger: "[data-metric-grid]",
            start: "top 86%",
            toggleActions: "play none none none",
          },
        }
      );

      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((element) => {
        gsap.fromTo(
          element,
          { opacity: 0, y: 42, scale: 0.985, filter: "blur(5px)" },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
            duration: 0.85,
            ease: "power3.out",
            scrollTrigger: {
              trigger: element,
              start: "top 83%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });
    },
    { scope: rootRef }
  );

  useGSAP(
    () => {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReducedMotion) return;

      gsap.fromTo(
        "[data-scale-card]",
        { opacity: 0.45, y: 14 },
        { opacity: 1, y: 0, duration: 0.38, stagger: 0.05, ease: "power2.out" }
      );
    },
    { scope: rootRef, dependencies: [wardCount], revertOnUpdate: true }
  );

  return (
    <main ref={rootRef} className={cx(styles.page, isDark ? styles.dark : styles.light)}>
      <a href="#quotation-main" className={styles.skipLink}>
        Skip to main content
      </a>

      <div className={styles.printHidden}>
        <Animatedheader themeColors={quotationHeaderTheme} />
      </div>

      <section className={styles.hero}>
        <div className={styles.container}>
          <p className={styles.heroEyebrow} data-hero-kicker>
            {quotationHero.eyebrow}
          </p>
          <h1 className={styles.heroTitle} data-hero-title>
            {quotationHero.title}
          </h1>
          <p className={styles.heroLead} data-hero-sub>
            {quotationHero.lead}
          </p>

          <div className={styles.heroMeta} data-hero-status>
            <p className={styles.heroMetaTag}>{quotationHero.documentNumber}</p>
            <p className={styles.heroStatusPill}>
              <span className={styles.liveDot} />
              {quotationHero.status}
            </p>
          </div>

          <div className={styles.heroChips}>
            {quotationHeroChips.map((chip) => (
              <span key={chip} className={styles.heroChip} data-hero-chip>
                {chip}
              </span>
            ))}
          </div>

          <nav className={`${styles.mobileToc} ${styles.printHidden}`} aria-label="Quotation sections">
            <div className={styles.mobileTocInner}>
              {sections.map((section) => (
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
        <div className={styles.contentLayout}>
          <aside className={`${styles.sidebar} ${styles.printHidden}`}>
            <p className={styles.sidebarLabel}>Contents</p>
            <nav className={styles.sidebarNav} aria-label="Quotation table of contents">
              {sections.map((section) => (
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
              <button
                type="button"
                className={styles.printButton}
                onClick={() => {
                  void handlePrint();
                }}
              >
                Print or save PDF
              </button>
            </div>
          </aside>

          <div id="quotation-main" className={styles.contentMain}>
            {sections.map((section) => (
              <section key={section.id} id={section.id} className={styles.docSection}>
                <header className={styles.sectionHead}>
                  <span className={styles.sectionLabel}>{section.label}</span>
                  <h2 className={styles.sectionTitle}>{section.title}</h2>
                  {section.summary ? <p className={styles.sectionSummary}>{section.summary}</p> : null}
                </header>
                <div className={styles.sectionBody}>{section.content}</div>
              </section>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.printHidden}>
        <MegaFooter
          brandName="Team 404"
          tagline="Designing delightful digital experiences."
          socialLinks={[
            { platform: "twitter", href: "https://twitter.com" },
            { platform: "github", href: "https://github.com/Prakharrdev/ps-crmdev1" },
            { platform: "linkedin", href: "https://linkedin.com" },
          ]}
          showNewsletter
          newsletterTitle="Stay updated"
          newsletterPlaceholder="Enter your email"
          brandColor="#1c1612"
          brandColorDark="#ffffff"
          newsletterTitleColor="#1c1612"
          newsletterTitleColorDark="#ffffff"
        />
      </div>
    </main>
  );
}
