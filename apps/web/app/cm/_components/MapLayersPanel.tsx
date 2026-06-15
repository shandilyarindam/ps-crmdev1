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
  { id: "density", label: "Complaint Density", iconName: "flame", colorClass: "text-red-500" },
  { id: "critical", label: "Critical Issues", iconName: "critical", colorClass: "text-red-500" },
  { id: "sla", label: "SLA Breaches", iconName: "sla", colorClass: "text-amber-500" },
  { id: "garbage", label: "Garbage Hotspots", iconName: "garbage", colorClass: "text-emerald-500" },
  { id: "roads", label: "Road & Potholes", iconName: "roads", colorClass: "text-indigo-500" },
  { id: "water", label: "Water Leakages", iconName: "water", colorClass: "text-blue-500" },
  { id: "streetlights", label: "Streetlights Out", iconName: "streetlights", colorClass: "text-amber-400" },
  { id: "cctv", label: "CCTV AI Detections", iconName: "cctv", colorClass: "text-cyan-500" },
];

const defaultLegend: SeverityLegendItem[] = [
  { label: "Very High / Critical", colorClass: "bg-red-600" },
  { label: "High Priority", colorClass: "bg-orange-500" },
  { label: "Medium Priority", colorClass: "bg-amber-400" },
  { label: "Low Priority", colorClass: "bg-emerald-500" },
];

export const MapLayersPanel: React.FC<MapLayersPanelProps> = ({
  activeLayer,
  onLayerChange,
  intensity,
  onIntensityChange,
  layers = defaultLayers,
  legendItems = defaultLegend,
  className,
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

  return (
    <aside
      ref={panelRef}
      className={cn("opacity-0 w-full xl:w-56 shrink-0 flex flex-row xl:flex-col gap-2.5 select-none", className)}
    >
      {/* Map Layers Section */}
      <div className="flex-1 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between">
        <div>
          <h3 className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-zinc-500 uppercase flex items-center gap-2 mb-3">
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
                      ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 font-bold"
                      : "text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800"
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
                    className="h-3 w-3 accent-emerald-600 cursor-pointer"
                  />
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Legend & Slider Section */}
      <div className="flex-1 xl:flex-none rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-center">
        <h3 className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-zinc-500 uppercase mb-2">
          SEVERITY LEGEND
        </h3>
        <ul className="grid grid-cols-2 xl:grid-cols-1 gap-1.5">
          {legendItems.map((item, idx) => (
            <li key={idx} className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-400">
              <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${item.colorClass}`}></span>
              <span className="font-semibold text-[11px] truncate">{item.label}</span>
            </li>
          ))}
        </ul>

        {/* Heatmap Intensity Slider */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800">
          <h4 className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 mb-1.5 uppercase">
            Heatmap Intensity
          </h4>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-bold">-</span>
            <input
              type="range"
              min="10"
              max="100"
              value={intensity}
              onChange={(e) => onIntensityChange(Number(e.target.value))}
              className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 dark:bg-zinc-800"
            />
            <span className="text-[10px] text-slate-400 font-bold">+</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
