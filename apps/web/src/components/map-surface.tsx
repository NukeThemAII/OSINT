'use client';

import { useEffect, useMemo, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { ScatterplotLayer } from '@deck.gl/layers';
import { MapboxOverlay } from '@deck.gl/mapbox';
import { strategicPoints, type MapFeature } from '@investor-intel/core';

type LayerPoint = {
  id: string;
  label: string;
  lon: number;
  lat: number;
  kind: 'strategic' | 'event';
  severity?: number;
};

export function MapSurface({ items }: { items: MapFeature[] }) {
  const ref = useRef<HTMLDivElement | null>(null);

  const points = useMemo<LayerPoint[]>(() => {
    const eventPoints = items.map((item) => ({
      id: item.id,
      label: item.title,
      lon: item.point.lon,
      lat: item.point.lat,
      kind: 'event' as const,
      severity: item.severityScore,
    }));

    const strategic = strategicPoints.map((point) => ({
      id: point.key,
      label: point.label,
      lon: point.point.lon,
      lat: point.point.lat,
      kind: 'strategic' as const,
    }));

    return [...strategic, ...eventPoints];
  }, [items]);

  useEffect(() => {
    if (!ref.current) return;

    const map = new maplibregl.Map({
      container: ref.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [48.5, 25.5],
      zoom: 3.05,
      attributionControl: false,
    });

    const overlay = new MapboxOverlay({
      interleaved: true,
      layers: [
        new ScatterplotLayer<LayerPoint>({
          id: 'monitor-points',
          data: points,
          getPosition: (point) => [point.lon, point.lat],
          getRadius: (point) => (point.kind === 'strategic' ? 28_000 : 18_000 + (point.severity ?? 0) * 650),
          getFillColor: (point) => (point.kind === 'strategic' ? [56, 189, 248, 200] : [249, 115, 22, 210]),
          getLineColor: [226, 232, 240, 180],
          lineWidthMinPixels: 1,
          stroked: true,
          pickable: true,
          autoHighlight: true,
          onClick: ({ object }) => {
            if (!object) return;
            new maplibregl.Popup({ closeButton: false, offset: 14 })
              .setLngLat([object.lon, object.lat])
              .setHTML(`<div style="font-size:12px;color:#e2e8f0"><strong>${object.label}</strong><br/>${object.kind === 'strategic' ? 'Strategic reference point' : 'Normalized event signal'}</div>`)
              .addTo(map);
          },
        }),
      ],
    });

    map.on('load', () => {
      map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), 'top-right');
      map.addControl(new maplibregl.AttributionControl({ compact: true }));
      map.addControl(overlay);
    });

    return () => {
      map.remove();
    };
  }, [points]);

  return <div ref={ref} className="h-[480px] w-full overflow-hidden rounded-[24px] border border-slate-800/60" />;
}
