"use client";

import "leaflet/dist/leaflet.css";
import React from "react";
import type * as L from "leaflet";
import { MapPin, RefreshCw, Maximize2 } from "lucide-react";
import { BASIN_CENTER, BASIN_PLACES, BASIN_PLACE_KINDS, type BasinPlace, type BasinPlaceKind } from "@/constants/basin";

type Props = {
  /** Compact preview (no scroll-zoom, no side list), e.g. on the home page. */
  compact?: boolean;
  className?: string;
  /** Called when a place is chosen on the map. */
  onSelect?: (place: BasinPlace) => void;
  /** Place to focus (e.g. picked from a list next to the map). */
  focusId?: string | null;
  kinds?: BasinPlaceKind[];
};

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function pinHtml(kind: BasinPlaceKind) {
  const color = BASIN_PLACE_KINDS[kind].color;
  const size = kind === "office" ? 34 : 26;
  const inner = kind === "office"
    ? `<img src="/images/sihu-mark.png" alt="" style="width:22px;height:22px;border-radius:9999px;background:#fff" />`
    : `<span style="width:8px;height:8px;border-radius:9999px;background:#fff;display:block"></span>`;
  return `<span style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:3px solid #fff;box-shadow:0 6px 16px -6px rgba(15,23,42,.6)">${inner}</span>`;
}

export default function BasinMap({ compact = false, className, onSelect, focusId, kinds }: Props) {
  const box = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<L.Map | null>(null);
  const markers = React.useRef(new Map<string, L.Marker>());
  const onSelectRef = React.useRef(onSelect);
  const [state, setState] = React.useState<"loading" | "ready" | "error">("loading");
  const [tilesFailed, setTilesFailed] = React.useState(false);
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  // Create the map once (per retry). Leaflet touches `window`, so it is loaded in the browser only.
  React.useEffect(() => {
    let cancelled = false;
    let map: L.Map | null = null;
    const markerMap = markers.current;
    (async () => {
      try {
        const leaflet = (await import("leaflet")).default;
        if (cancelled || !box.current) return;
        map = leaflet.map(box.current, {
          center: BASIN_CENTER,
          zoom: compact ? 8 : 8,
          minZoom: 6,
          maxZoom: 16,
          scrollWheelZoom: !compact,
          zoomControl: true,
          attributionControl: true,
        });
        let tileErrors = 0;
        leaflet
          // Standard OpenStreetMap tiles: free with attribution, no API key.
          // (CARTO basemaps now return "API KEY REQUIRED" placeholder tiles.)
          .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          })
          .on("tileerror", () => { if (++tileErrors > 6 && !cancelled) setTilesFailed(true); })
          .on("load", () => { if (!cancelled) setTilesFailed(false); })
          .addTo(map);

        for (const place of BASIN_PLACES) {
          const icon = leaflet.divIcon({ html: pinHtml(place.kind), className: "", iconSize: place.kind === "office" ? [34, 34] : [26, 26], iconAnchor: place.kind === "office" ? [17, 17] : [13, 13] });
          const marker = leaflet
            .marker([place.lat, place.lng], { icon, title: place.name, keyboard: true, riseOnHover: true, zIndexOffset: place.kind === "office" ? 1000 : 0 })
            .bindPopup(
              `<div style="font-family:var(--font-inter),system-ui,sans-serif;max-width:240px">
                 <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:${BASIN_PLACE_KINDS[place.kind].color}">${escapeHtml(BASIN_PLACE_KINDS[place.kind].label)}</p>
                 <p style="margin:4px 0 0;font-size:15px;font-weight:700;color:#0f172a">${escapeHtml(place.name)}</p>
                 <p style="margin:6px 0 0;font-size:13px;line-height:1.5;color:#475569">${escapeHtml(place.summary)}</p>
               </div>`,
            )
            .on("click", () => onSelectRef.current?.(place))
            .addTo(map);
          markerMap.set(place.id, marker);
        }
        mapRef.current = map;
        setState("ready");
        // The container may have been laid out after creation (e.g. inside an animation).
        setTimeout(() => map?.invalidateSize(), 250);
      } catch (error) {
        console.error("[BasinMap]", error);
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
      markerMap.clear();
      map?.remove();
      mapRef.current = null;
    };
  }, [compact, attempt]);

  // Show only the chosen kinds of places.
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || state !== "ready") return;
    for (const place of BASIN_PLACES) {
      const marker = markers.current.get(place.id);
      if (!marker) continue;
      const show = !kinds || kinds.includes(place.kind);
      if (show && !map.hasLayer(marker)) marker.addTo(map);
      if (!show && map.hasLayer(marker)) marker.remove();
    }
  }, [kinds, state]);

  // Fly to a place picked outside the map.
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || state !== "ready" || !focusId) return;
    const place = BASIN_PLACES.find((p) => p.id === focusId);
    const marker = markers.current.get(focusId);
    if (!place || !marker) return;
    map.flyTo([place.lat, place.lng], Math.max(map.getZoom(), place.kind === "water" && place.id === "lake-victoria" ? 8 : 10), { duration: 0.8 });
    setTimeout(() => marker.openPopup(), 850);
  }, [focusId, state]);

  const reset = () => mapRef.current?.flyTo(BASIN_CENTER, 8, { duration: 0.6 });

  return (
    <div className={`relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 isolate ${className ?? "h-[420px]"}`}>
      <div ref={box} className="absolute inset-0 z-0" role="region" aria-label="Map of the Lake Victoria Basin in Kenya" />

      {state === "loading" && (
        <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-sky-50 to-slate-100 animate-pulse" aria-live="polite">
          <MapPin className="text-sky-600" size={28} />
          <p className="text-[14px] font-semibold text-slate-600">Loading the basin map…</p>
        </div>
      )}

      {state === "error" && (
        <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center gap-3 bg-slate-50 p-6 text-center" role="alert">
          <MapPin className="text-slate-400" size={28} />
          <p className="font-semibold text-slate-800">The map could not be loaded.</p>
          <p className="text-[14px] text-slate-500 max-w-sm">Check your connection and try again.</p>
          <button onClick={() => { setState("loading"); setAttempt((a) => a + 1); }} className="mt-1 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white text-[13px] font-semibold hover:bg-sky-600">
            <RefreshCw size={14} /> Try again
          </button>
        </div>
      )}

      {state === "ready" && tilesFailed && (
        <p className="absolute left-3 right-3 top-3 z-[500] rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-[12.5px] text-amber-900 shadow-sm" role="status">
          Map background is offline — places are still shown. Reconnect to see roads and terrain.
        </p>
      )}

      {state === "ready" && !compact && (
        <button onClick={reset} title="Show the whole basin" aria-label="Show the whole basin"
          className="absolute right-3 bottom-8 z-[500] w-10 h-10 rounded-xl bg-white shadow-md border border-slate-200 text-slate-700 hover:text-sky-700 flex items-center justify-center">
          <Maximize2 size={16} />
        </button>
      )}
    </div>
  );
}
