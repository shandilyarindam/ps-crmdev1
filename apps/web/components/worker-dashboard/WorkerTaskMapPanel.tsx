"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import Map, { Marker, Popup } from "react-map-gl/maplibre"
import type { MapRef } from "react-map-gl/maplibre"
import {
  markerColor,
  severityClass,
  type DashboardTask,
} from "@/components/worker-dashboard/dashboard-types"
import { useTheme } from "@/components/ThemeProvider"
import { getMapStyle } from "@/lib/map-tiles"

type WorkerTaskMapPanelProps = {
  tasks: DashboardTask[]
  highlightedTaskId?: string | null
  loading: boolean
  error: string | null
  onSelectTask?: (taskId: string) => void
}

export default function WorkerTaskMapPanel({
  tasks,
  highlightedTaskId,
  loading,
  error,
  onSelectTask,
}: WorkerTaskMapPanelProps) {
  const { theme } = useTheme()
  const mapRef = useRef<MapRef>(null)
  const [recenterTrigger, setRecenterTrigger] = useState(0)
  const [activePopupTask, setActivePopupTask] = useState<DashboardTask | null>(null)

  const mapStyle = getMapStyle(theme)

  const mappableTasks = useMemo(
    () => tasks.filter((task) => task.latitude != null && task.longitude != null),
    [tasks],
  )

  const highlightedPoint = useMemo(() => {
    if (!highlightedTaskId) return null
    const task = mappableTasks.find((item) => item.id === highlightedTaskId)
    if (!task || task.latitude == null || task.longitude == null) return null
    return { lat: task.latitude, lng: task.longitude }
  }, [highlightedTaskId, mappableTasks])

  const mapPoints = useMemo(
    () => mappableTasks.map((task) => ({ lat: task.latitude as number, lng: task.longitude as number })),
    [mappableTasks],
  )

  // Fit bounds to show all tasks initially
  useEffect(() => {
    if (mappableTasks.length === 0) return

    // Allow the map to load its style/container before fitting bounds
    const timer = setTimeout(() => {
      if (!mapRef.current) return
      if (mappableTasks.length === 1) {
        mapRef.current.easeTo({
          center: [mappableTasks[0].longitude as number, mappableTasks[0].latitude as number],
          zoom: 14,
          duration: 1000,
        })
        return
      }
      let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity
      for (const t of mappableTasks) {
        const lng = t.longitude as number
        const lat = t.latitude as number
        if (lng < minLng) minLng = lng
        if (lat < minLat) minLat = lat
        if (lng > maxLng) maxLng = lng
        if (lat > maxLat) maxLat = lat
      }
      mapRef.current.fitBounds([[minLng, minLat], [maxLng, maxLat]], {
        padding: 40,
        maxZoom: 15,
      })
    }, 100)

    return () => clearTimeout(timer)
  }, [mappableTasks])

  // Recenter/fit bounds when Reset View is clicked
  useEffect(() => {
    if (recenterTrigger === 0 || mappableTasks.length === 0) return
    if (!mapRef.current) return

    if (mappableTasks.length === 1) {
      mapRef.current.easeTo({
        center: [mappableTasks[0].longitude as number, mappableTasks[0].latitude as number],
        zoom: 14,
        duration: 1000,
      })
      return
    }

    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity
    for (const t of mappableTasks) {
      const lng = t.longitude as number
      const lat = t.latitude as number
      if (lng < minLng) minLng = lng
      if (lat < minLat) minLat = lat
      if (lng > maxLng) maxLng = lng
      if (lat > maxLat) maxLat = lat
    }
    mapRef.current.fitBounds([[minLng, minLat], [maxLng, maxLat]], {
      padding: 40,
      maxZoom: 15,
    })
  }, [recenterTrigger, mappableTasks])

  // Pan to highlighted task when it changes
  useEffect(() => {
    if (!highlightedPoint || !mapRef.current) return
    mapRef.current.easeTo({
      center: [highlightedPoint.lng, highlightedPoint.lat],
      zoom: 15,
      duration: 1000,
    })
  }, [highlightedPoint])

  return (
    <section className="flex h-full min-h-0 flex-col rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4 dark:border-[#2a2a2a] dark:bg-[#1e1e1e]">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 sm:text-base">Task Map</h2>
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <span className="text-xs text-gray-500 dark:text-gray-400">Live ticket locations</span>
          <button
            type="button"
            onClick={() => setRecenterTrigger((prev) => prev + 1)}
            className="rounded-md bg-gray-900 px-2.5 py-1 text-[11px] font-medium text-white transition-colors hover:bg-gray-700"
          >
            Reset View
          </button>
        </div>
      </div>

      {error ? (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      ) : null}

      {loading ? <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">Loading map...</p> : null}

      <div className="relative min-h-[380px] flex-1 overflow-hidden rounded-lg border border-gray-100 dark:border-[#2a2a2a]" style={{ height: "clamp(380px, 60vh, 620px)" }}>
        <Map
          ref={mapRef}
          initialViewState={{
            longitude: 77.209,
            latitude: 28.6139,
            zoom: 12,
          }}
          style={{ height: "100%", width: "100%" }}
          mapStyle={mapStyle}
          scrollZoom={true}
        >
          {mappableTasks.map((task) => {
            const isHighlighted = task.id === highlightedTaskId
            const size = isHighlighted ? 22 : 18
            const border = isHighlighted ? 4 : 3
            const color = markerColor(task.severity)
            const shadow = isHighlighted
              ? "0 0 0 3px rgba(180,114,90,0.25), 0 0 8px rgba(0,0,0,0.3)"
              : "0 0 6px rgba(0,0,0,0.25)"

            return (
              <Marker
                key={task.id}
                longitude={task.longitude as number}
                latitude={task.latitude as number}
                onClick={(e) => {
                  e.originalEvent.stopPropagation()
                  setActivePopupTask(task)
                  if (onSelectTask) {
                    onSelectTask(task.id)
                  }
                }}
              >
                <div
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    borderRadius: "50%",
                    backgroundColor: color,
                    border: `${border}px solid #fff`,
                    boxShadow: shadow,
                    cursor: "pointer",
                  }}
                />
              </Marker>
            )
          })}

          {activePopupTask && activePopupTask.longitude != null && activePopupTask.latitude != null && (
            <Popup
              longitude={activePopupTask.longitude}
              latitude={activePopupTask.latitude}
              anchor="bottom"
              onClose={() => setActivePopupTask(null)}
              closeOnClick={false}
              offset={15}
            >
              <div className="space-y-2 text-sm text-gray-900 dark:text-gray-100">
                <p className="font-semibold">{activePopupTask.ticketId}</p>
                <p>{activePopupTask.description.length > 80 ? `${activePopupTask.description.slice(0, 77)}...` : activePopupTask.description}</p>
                <span className={`inline-block rounded-full border px-2 py-1 text-xs ${severityClass(activePopupTask.severity)}`}>
                  {activePopupTask.severity}
                </span>
              </div>
            </Popup>
          )}
        </Map>

        {highlightedTaskId ? (
          <div className="pointer-events-none absolute left-3 top-3 z-[500] rounded-md bg-black/70 px-2 py-1 text-xs text-white">
            Focused: {tasks.find((task) => task.id === highlightedTaskId)?.ticketId ?? "Selected"}
          </div>
        ) : null}

        {!loading && mappableTasks.length === 0 ? (
          <div className="pointer-events-none absolute inset-0 z-[500] flex items-center justify-center bg-white/80 text-sm font-medium text-gray-600 dark:bg-[#1e1e1e]/85 dark:text-gray-300">
            No tasks to display on map.
          </div>
        ) : null}
      </div>
    </section>
  )
}
