"use client";

import React, { useRef } from "react";
import {
  Layers,
  Flame,
  AlertTriangle,
  Clock3,
  Trash2,
  Route,
  Droplet,
  Lightbulb,
  Video,
  type LucideIcon,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export interface MapLayerItem {
  id: string;
  label: string;
  iconName: "flame" | "critical" | "sla" | "garbage" | "roads" | "water" | "streetlights" | "cctv";
  colorClass: string;
}

export interface SeverityLegendItem {
  label: string;
  colorClass: string;
}

import { cn } from "@/src/lib/utils";

export interface MapLayersPanelProps {
  activeLayer: string;
  onLayerChange: (layerId: string) => void;
  intensity: number;
  onIntensityChange: (intensity: number) => void;
  layers?: MapLayerItem[];
  legendItems?: SeverityLegendItem[];
  className?: string;
  variant?: "sidebar" | "floating";
  activeSeverities?: string[];
  onToggleSeverity?: (severity: string) => void;
}

const iconMap: Record<MapLayerItem["iconName"], LucideIcon> = {
  flame: Flame,
  critical: AlertTriangle,
  sla: Clock3,
  garbage: Trash2,
  roads: Route,
  water: Droplet,
  streetlights: Lightbulb,
  cctv: Video,
};

const defaultLayers: MapLayerItem[] = [
  { id: "density", label: "Complaint Density", iconName: "flame", colorClass: "text-emerald-600 dark:text-emerald-400" },
  { id: "critical", label: "Critical Issues", iconName: "critical", colorClass: "text-red-500" },
  { id: "sla", label: "SLA Breaches", iconName: "sla", colorClass: "text-amber-500" },
  { id: "garbage", label: "Garbage", iconName: "garbage", colorClass: "text-emerald-500" },
  { id: "roads", label: "Roads", iconName: "roads", colorClass: "text-indigo-500" },
  { id: "water", label: "Water", iconName: "water", colorClass: "text-blue-500" },
  { id: "streetlights", label: "Streetlights", iconName: "streetlights", colorClass: "text-amber-400" },
  { id: "cctv", label: "CCTV Detections", iconName: "cctv", colorClass: "text-cyan-500" },
];

const defaultLegend: SeverityLegendItem[] = [
  { label: "Very High", colorClass: "bg-[#b91c1c]" },
  { label: "High", colorClass: "bg-[#ea580c]" },
  { label: "Medium", colorClass: "bg-[#eab308]" },
  { label: "Low", colorClass: "bg-[#22c55e]" },
  { label: "Very Low", colorClass: "bg-[#0d9488]" },
];

export const MapLayersPanel: React.FC<MapLayersPanelProps> = ({
  activeLayer,
  onLayerChange,
  intensity,
  onIntensityChange,
  layers = defaultLayers,
  legendItems = defaultLegend,
  className,
  variant = "sidebar",
  activeSeverities,
  onToggleSeverity,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        panelRef.current,
        { x: -30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, ease: "power2.out" }
      );
    },
    { scope: panelRef }
  );

  if (variant === "floating") {
    return (
      <aside
        ref={panelRef}
        className={cn(
          "opacity-0 select-none flex flex-col gap-2 w-56 pointer-events-none transition-colors duration-300",
          className
        )}
      >
        {/* Map Layers Section */}
        <div className="rounded-xl border border-theme-border bg-theme-card/95 p-2.5 shadow-lg backdrop-blur-md pointer-events-auto">
          <h3 className="text-[10px] font-bold tracking-wider text-theme-muted uppercase flex items-center gap-2 mb-2">
            <Layers size={12} /> MAP LAYERS
          </h3>
          <ul className="space-y-1">
            {layers.map((layer) => {
              const IconComponent = iconMap[layer.iconName];
              const isSelected = activeLayer === layer.id;

              return (
                <li
                  key={layer.id}
                  onClick={() => onLayerChange(layer.id)}
                  className={`flex items-center justify-between rounded-lg px-2 py-1 text-xs font-semibold cursor-pointer transition-all ${
                    isSelected
                      ? "bg-theme-bg/60 text-theme-accent font-bold"
                      : "text-theme-text/80 hover:bg-theme-bg/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {IconComponent && <IconComponent size={14} className={layer.colorClass} />}
                    <span>{layer.label}</span>
                  </div>
                  <input
                    type="radio"
                    name="map_layer_group"
                    checked={isSelected}
                    onChange={() => onLayerChange(layer.id)}
                    className="h-3 w-3 accent-theme-accent cursor-pointer"
                  />
                </li>
              );
            })}
          </ul>
        </div>

        {/* Legend & Slider Section */}
        <div className="rounded-xl border border-theme-border bg-theme-card/95 p-2.5 shadow-lg backdrop-blur-md pointer-events-auto">
          {/* Legend Section */}
          <div>
            <h3 className="text-[10px] font-bold tracking-wider text-theme-muted uppercase mb-1.5">
              SEVERITY LEGEND
            </h3>
            <ul className="space-y-1">
              {legendItems.map((item, idx) => {
                const isSelected = !activeSeverities || activeSeverities.includes(item.label);
                return (
                  <li
                    key={idx}
                    onClick={() => onToggleSeverity?.(item.label)}
                    className={`flex items-center gap-2 text-xs cursor-pointer select-none transition-all ${
                      isSelected
                        ? "text-theme-text opacity-100 font-semibold"
                        : "text-theme-muted opacity-40 hover:opacity-65"
                    }`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${item.colorClass} ${!isSelected && "bg-theme-bg/60"}`}></span>
                    <span className="text-[11px] truncate">{item.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="border-t border-theme-border/50 my-2" />

          {/* Slider Section */}
          <div>
            <h4 className="text-[10px] font-bold text-theme-muted mb-1 uppercase">
              Heatmap Intensity
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-theme-muted font-bold">-</span>
              <input
                type="range"
                min="10"
                max="100"
                value={intensity}
                onChange={(e) => onIntensityChange(Number(e.target.value))}
                className="w-full h-1 bg-theme-bg rounded-lg appearance-none cursor-pointer accent-theme-accent"
              />
              <span className="text-[10px] text-theme-muted font-bold">+</span>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside
      ref={panelRef}
      className={cn("opacity-0 w-full xl:w-56 shrink-0 flex flex-row xl:flex-col gap-2.5 select-none transition-colors duration-300", className)}
    >
      {/* Map Layers Section */}
      <div className="flex-1 rounded-xl border border-theme-border bg-theme-card p-3.5 shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="text-[10px] font-bold tracking-wider text-theme-muted uppercase flex items-center gap-2 mb-3">
            <Layers size={12} /> MAP LAYERS
          </h3>
          <ul className="space-y-1 sm:space-y-2">
            {layers.map((layer) => {
              const IconComponent = iconMap[layer.iconName];
              const isSelected = activeLayer === layer.id;

              return (
                <li
                  key={layer.id}
                  onClick={() => onLayerChange(layer.id)}
                  className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold cursor-pointer transition-all ${
                    isSelected
                      ? "bg-theme-bg/60 text-theme-accent font-bold"
                      : "text-theme-text/80 hover:bg-theme-bg/40"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {IconComponent && <IconComponent size={14} className={layer.colorClass} />}
                    <span>{layer.label}</span>
                  </div>
                  <input
                    type="radio"
                    name="map_layer_group"
                    checked={isSelected}
                    onChange={() => onLayerChange(layer.id)}
                    className="h-3 w-3 accent-theme-accent cursor-pointer"
                  />
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Legend & Slider Section */}
      <div className="flex-1 xl:flex-none rounded-xl border border-theme-border bg-theme-card p-3.5 shadow-sm flex flex-col justify-center">
        <h3 className="text-[10px] font-bold tracking-wider text-theme-muted uppercase mb-2">
          SEVERITY LEGEND
        </h3>
        <ul className="grid grid-cols-2 xl:grid-cols-1 gap-1.5">
          {legendItems.map((item, idx) => {
            const isSelected = !activeSeverities || activeSeverities.includes(item.label);
            return (
              <li
                key={idx}
                onClick={() => onToggleSeverity?.(item.label)}
                className={`flex items-center gap-2 text-xs cursor-pointer select-none transition-all ${
                  isSelected
                    ? "text-theme-text opacity-100 font-semibold"
                    : "text-theme-muted opacity-40 hover:opacity-65"
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${item.colorClass} ${!isSelected && "bg-theme-bg/60"}`}></span>
                <span className="text-[11px] truncate">{item.label}</span>
              </li>
            );
          })}
        </ul>

        {/* Heatmap Intensity Slider */}
        <div className="mt-4 pt-3 border-t border-theme-border">
          <h4 className="text-[10px] font-bold text-theme-muted mb-1.5 uppercase">
            Heatmap Intensity
          </h4>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-theme-muted font-bold">-</span>
            <input
              type="range"
              min="10"
              max="100"
              value={intensity}
              onChange={(e) => onIntensityChange(Number(e.target.value))}
              className="w-full h-1 bg-theme-bg rounded-lg appearance-none cursor-pointer accent-theme-accent"
            />
            <span className="text-[10px] text-theme-muted font-bold">+</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
