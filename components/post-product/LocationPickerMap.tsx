import React, { useEffect, useRef } from "react";

declare global {
  interface Window {
    L?: any;
  }
}

const LEAFLET_CSS_ID = "leaflet-css-cdn";
const LEAFLET_SCRIPT_ID = "leaflet-script-cdn";

const ensureLeafletLoaded = async () => {
  if (!document.getElementById(LEAFLET_CSS_ID)) {
    const link = document.createElement("link");
    link.id = LEAFLET_CSS_ID;
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
  }

  if (window.L) return window.L;

  await new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(
      LEAFLET_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Leaflet load failed")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = LEAFLET_SCRIPT_ID;
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Leaflet load failed"));
    document.body.appendChild(script);
  });

  return window.L;
};

interface LocationPickerMapProps {
  center: [number, number];
  markerPosition: [number, number] | null;
  visible: boolean;
  onPick: (lat: number, lng: number) => void;
}

const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  center,
  markerPosition,
  visible,
  onPick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!visible || !containerRef.current) return;

    let cancelled = false;

    const initMap = async () => {
      try {
        const L = await ensureLeafletLoaded();
        if (cancelled || !containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current, {
          center,
          zoom: 16,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(map);

        const marker = L.marker(markerPosition || center, {
          draggable: true,
        }).addTo(map);

        map.on("click", (event: any) => {
          const { lat, lng } = event.latlng;
          marker.setLatLng([lat, lng]);
          onPick(lat, lng);
        });

        marker.on("dragend", () => {
          const { lat, lng } = marker.getLatLng();
          onPick(lat, lng);
        });

        mapRef.current = map;
        markerRef.current = marker;

        if (markerPosition) {
          map.setView(markerPosition, 17);
        }

        setTimeout(() => map.invalidateSize(), 0);
      } catch (error) {
        console.error("Khong the tai ban do:", error);
      }
    };

    initMap();

    return () => {
      cancelled = true;
      markerRef.current = null;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [center, markerPosition, onPick, visible]);

  useEffect(() => {
    if (!visible || !mapRef.current || !markerRef.current) return;

    const target = markerPosition || center;
    markerRef.current.setLatLng(target);
    mapRef.current.setView(target, mapRef.current.getZoom(), { animate: true });
    mapRef.current.invalidateSize();
  }, [center, markerPosition, visible]);

  if (!visible) return null;

  return (
    <div
      ref={containerRef}
      className="h-80 w-full rounded-2xl border border-gray-200 overflow-hidden"
    />
  );
};

export default LocationPickerMap;
