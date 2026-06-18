"use client";

import React, { useRef } from "react";
import { User, Phone, FileText } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { CouncillorData } from "./cm-types";

gsap.registerPlugin(useGSAP);

/** A single metric chip in the 4-column stat grid. */
export interface ProfileMetric {
  label: string;
  value: string;
  /** Render the value in emerald (e.g. health scores). */
  highlight?: boolean;
  /** Small muted suffix appended to the value (e.g. "/100"). */
  suffix?: string;
}

export interface CouncillorInfoCardProps {
  councillor?: CouncillorData | null;
  /** Card header label. Defaults to "WARD INFORMATION". */
  title?: string;
  /** Override the 4-metric grid (e.g. for a Zone Commissioner). */
  metrics?: ProfileMetric[];
  /** Show the About section (councillor-only). Defaults to true. */
  showAbout?: boolean;
  /** Show the party badge. Defaults to true. */
  showParty?: boolean;
  /** When provided, renders a "Call" button in the header. */
  onCall?: () => void;
  loading?: boolean;
}

export const CouncillorInfoCard: React.FC<CouncillorInfoCardProps> = ({
  councillor,
  title = "WARD INFORMATION",
  metrics,
  showAbout = true,
  showParty = true,
  onCall,
  loading = false,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!loading && councillor) {
        // Zoom-in/fade-in entry animation when data loaded
        gsap.fromTo(
          cardRef.current,
          { scale: 0.95, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.5, ease: "power2.out" }
        );
      }
    },
    { dependencies: [loading, councillor], scope: cardRef }
  );

  // If loading or councillor details are not yet available, render the pulsing skeleton loader
  if (loading || !councillor) {
    return (
      <div
        ref={cardRef}
        className="bg-theme-card rounded-xl border border-theme-border p-4 shadow-sm flex-1 lg:max-w-md select-none flex flex-col gap-3.5 animate-pulse transition-colors duration-300"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="h-3.5 w-3.5 bg-theme-bg rounded-full"></div>
            <div className="h-3 w-28 bg-theme-bg rounded"></div>
          </div>
        </div>

        {/* Profile Area */}
        <div className="flex items-start gap-4">
          <div className="h-28 w-24 rounded-lg bg-theme-bg shrink-0"></div>
          <div className="flex-1 space-y-3 mt-2">
            <div className="h-2 w-12 bg-theme-bg rounded"></div>
            <div className="h-4 w-32 bg-theme-bg rounded"></div>
            <div className="h-2.5 w-40 bg-theme-bg rounded"></div>
            <div className="h-3 w-20 bg-theme-bg rounded-full mt-1"></div>
          </div>
        </div>

        {/* Details Section */}
        {showAbout && (
          <div className="p-3 bg-theme-bg/25 rounded-lg border border-theme-border/40 space-y-3">
            <div className="h-2.5 w-24 bg-theme-bg rounded"></div>
            <div className="space-y-2.5">
              <div className="space-y-1">
                <div className="h-1.5 w-12 bg-theme-bg/60 rounded"></div>
                <div className="h-2.5 w-24 bg-theme-bg rounded"></div>
              </div>
              <div className="space-y-1">
                <div className="h-1.5 w-32 bg-theme-bg/60 rounded"></div>
                <div className="h-2.5 w-48 bg-theme-bg rounded"></div>
              </div>
              <div className="space-y-1">
                <div className="h-1.5 w-20 bg-theme-bg/60 rounded"></div>
                <div className="h-2.5 w-32 bg-theme-bg rounded"></div>
              </div>
              <div className="space-y-1">
                <div className="h-1.5 w-16 bg-theme-bg/60 rounded"></div>
                <div className="h-2.5 w-16 bg-theme-bg rounded"></div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2 border-t border-theme-border pt-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center space-y-2">
              <div className="h-2 w-10 bg-theme-bg rounded mx-auto"></div>
              <div className="h-3 w-8 bg-theme-bg rounded mx-auto"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const cleanName = councillor.name.replace(/^(SH\.|MS\.|MR\.|MRS\.)\s+/i, "");
  const cleanWardName = councillor.voterCard && councillor.voterCard.includes("-")
    ? councillor.voterCard.split("-")[1]
    : councillor.voterCard;

  return (
    <div
      ref={cardRef}
      className="opacity-0 bg-theme-card rounded-xl border border-theme-border p-4 shadow-sm flex-1 lg:max-w-md select-none flex flex-col gap-3.5 transition-colors duration-300"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-bold tracking-wider text-theme-muted uppercase flex items-center gap-1.5">
          <FileText size={12} className="text-theme-muted" />
          {title}
        </h3>
        {onCall && (
          <button
            onClick={onCall}
            className="flex items-center gap-1 rounded-md border border-theme-border bg-theme-bg px-2 py-1 text-[10px] font-bold text-theme-text hover:bg-theme-bg/85 transition-colors duration-300"
          >
            <Phone size={11} /> Call
          </button>
        )}
      </div>

      {/* Header Profile Area */}
      <div className="flex items-start gap-4">
        {/* Left Side Portrait Container */}
        <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-lg bg-theme-bg flex items-center justify-center border border-theme-border">
          <User size={48} className="text-theme-muted" />
          <div className="absolute bottom-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-theme-accent border border-theme-card text-[8px] text-white font-black">
            {cleanName.charAt(0)}
          </div>
        </div>

        {/* Right Side Info */}
        <div className="flex-1 min-w-0">
          <span className="text-[9px] font-bold text-theme-muted uppercase tracking-wider block leading-none">
            Councillor
          </span>
          <h4 className="text-lg font-black text-theme-text mt-1 leading-tight truncate">
            {cleanName}
          </h4>
          <p className="text-[10px] text-theme-muted mt-2 leading-tight font-semibold">
            {councillor.role === "Ward Councillor"
              ? `Ward ${councillor.voterCard.split("-")[0]} - ${cleanWardName}`
              : councillor.body}
          </p>
          {showParty && (
            <div className="flex items-center gap-1.5 mt-3">
              <span className="text-[9px] font-bold text-theme-muted uppercase">Party:</span>
              <span className={`px-2 py-0.5 text-[8px] font-black rounded leading-none ${councillor.partyColor}`}>
                {councillor.party}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Detailed About Section */}
      {showAbout && (
        <div className="p-3 bg-theme-bg/30 rounded-lg border border-theme-border/50">
          <h5 className="text-[10px] font-bold text-theme-muted mb-2 uppercase tracking-wider">
            About Councillor
          </h5>
          <div className="space-y-2 text-[10px] text-theme-text font-semibold">
            {councillor.age ? (
              <div>
                <p className="text-theme-muted text-[8px] uppercase leading-none mb-0.5">
                  Age:
                </p>
                <p className="text-theme-text leading-tight">{councillor.age}</p>
              </div>
            ) : null}
            {councillor.voterCard && (
              <div>
                <p className="text-theme-muted text-[8px] uppercase leading-none mb-0.5">
                  Name Enrolled as Voter in:
                </p>
                <p className="text-theme-text leading-tight">
                  {cleanWardName} constituency, at Serial no {councillor.voterSerial ?? 0} in Part no {councillor.voterPart ?? 0}
                </p>
              </div>
            )}
            {councillor.education && (
              <div>
                <p className="text-theme-muted text-[8px] uppercase leading-none mb-0.5">
                  Education:
                </p>
                <p className="text-theme-text leading-tight">{councillor.education}</p>
              </div>
            )}
            {councillor.criminalCases !== undefined && (
              <div>
                <p className="text-theme-muted text-[8px] uppercase leading-none mb-0.5">
                  Criminal Cases:
                </p>
                <p className="text-theme-text leading-tight">{councillor.criminalCases}</p>
              </div>
            )}
            {councillor.assets && (
              <div>
                <p className="text-theme-muted text-[8px] uppercase leading-none mb-0.5">
                  Assets:
                </p>
                <p className="text-theme-text leading-tight">{councillor.assets}</p>
              </div>
            )}
            {councillor.liabilities && (
              <div>
                <p className="text-theme-muted text-[8px] uppercase leading-none mb-0.5">
                  Liabilities:
                </p>
                <p className="text-theme-text leading-tight">{councillor.liabilities}</p>
              </div>
            )}
            {councillor.phone && (
              <div>
                <p className="text-theme-muted text-[8px] uppercase leading-none mb-0.5">
                  Mobile:
                </p>
                <p className="text-theme-text leading-tight">{councillor.phone}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grid of Main Stats */}
      <div className="grid grid-cols-4 gap-2 border-t border-theme-border pt-3">
        {(metrics ?? [
          { label: "Complaints", value: String(councillor.complaints) },
          { label: "Resolution", value: councillor.resolutionTime },
          { label: "Satisfaction", value: councillor.satisfactionRate },
          { label: "Ward Health", value: String(councillor.wardHealth), suffix: "/100", highlight: true },
        ]).map((metric, idx) => (
          <div
            key={metric.label}
            className={`text-center ${idx > 0 ? "border-l border-theme-border pl-1" : ""}`}
          >
            <p className="text-[9px] font-bold text-theme-muted leading-tight">{metric.label}</p>
            <p
              className={`font-black text-sm mt-0.5 flex items-center justify-center gap-0.5 ${
                metric.highlight ? "text-theme-success" : "text-theme-text"
              }`}
            >
              {metric.value}
              {metric.suffix && <span className="text-[9px] font-medium text-theme-muted">{metric.suffix}</span>}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
