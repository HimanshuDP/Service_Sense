'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { HeatmapPoint, CATEGORY_THEMES } from '@/lib/types';

interface Props {
    points: HeatmapPoint[];
}

export default function MapView({ points }: Props) {
    return (
        <MapContainer
            center={[20.5937, 78.9629]}
            zoom={5}
            style={{ width: '100%', height: '100%', background: '#0f172a' }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
                className="map-tiles"
            />
            {points.map((p) => {
                const theme = CATEGORY_THEMES[p.category] ?? CATEGORY_THEMES.general;
                const radius = Math.max(8, Math.min(30, p.count * 2));
                return (
                    <CircleMarker
                        key={p.locality}
                        center={[p.lat, p.lng]}
                        radius={radius}
                        pathOptions={{
                            color: theme.primary,
                            fillColor: theme.primary,
                            fillOpacity: 0.55,
                            weight: 2,
                        }}
                    >
                        <Tooltip permanent={false} direction="top">
                            <div className="text-xs font-semibold">
                                {theme.icon} {p.locality}<br />
                                <span className="text-slate-400">{p.count} reports</span>
                            </div>
                        </Tooltip>
                    </CircleMarker>
                );
            })}
        </MapContainer>
    );
}
