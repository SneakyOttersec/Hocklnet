import { useEffect, useState } from 'react';
import type { GenePlace } from '../../types/genealogy';
import styles from './GeoMap.module.css';

interface Props {
  places: GenePlace[];
}

// Known place coordinates for the Hocquel family locations
const KNOWN_COORDS: Record<string, [number, number]> = {
  'lenauheim': [45.8667, 20.6167],
  'homolitz': [44.8833, 20.7167],
  'omoljica': [44.8833, 20.7167],
  'berghausen': [51.0333, 8.4333],
  'carpentras': [44.0556, 5.0489],
  'la roque-sur-pernes': [43.9833, 5.1167],
  'la roques sur pernes': [43.9833, 5.1167],
  'riedseltz': [48.9833, 7.9667],
  'ottenschlag': [48.4167, 15.2167],
  'dürnholz': [48.8167, 16.5167],
  'drnholec': [48.8167, 16.5167],
  'morscheld': [49.7667, 6.8833],
  'lovrin': [46.0667, 20.7333],
  'pločica': [44.9333, 21.1000],
  'brestovac': [44.8500, 21.0500],
  'knićanin': [45.1833, 20.3000],
  'russie': [55.7558, 37.6173],
  'lazo': [46.3667, 28.8167],
};

function findCoords(place: GenePlace): [number, number] | null {
  if (place.lat && place.lng) return [place.lat, place.lng];

  const city = (place.city || place.original || '').toLowerCase();
  for (const [key, coords] of Object.entries(KNOWN_COORDS)) {
    if (city.includes(key)) return coords;
  }
  return null;
}

export function GeoMap({ places }: Props) {
  const [mapReady, setMapReady] = useState(false);
  const [L, setL] = useState<typeof import('leaflet') | null>(null);

  useEffect(() => {
    // Dynamically import leaflet
    import('leaflet').then((leaflet) => {
      setL(leaflet.default || leaflet);
      setMapReady(true);
    });
  }, []);

  useEffect(() => {
    if (!mapReady || !L) return;

    // Fix default icon path
    delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const container = document.getElementById('geo-map');
    if (!container) return;

    // Clean up existing map
    if ((container as HTMLElement & { _leaflet_id?: number })._leaflet_id) {
      container.innerHTML = '';
      delete (container as HTMLElement & { _leaflet_id?: number })._leaflet_id;
    }

    const map = L.map(container).setView([47, 12], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const bounds: [number, number][] = [];

    const accentIcon = L.divIcon({
      className: styles.marker,
      html: '<div style="width:12px;height:12px;background:#cc2a41;border-radius:50%;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>',
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });

    for (const place of places) {
      const coords = findCoords(place);
      if (coords) {
        L.marker(coords, { icon: accentIcon })
          .bindPopup(place.original)
          .addTo(map);
        bounds.push(coords);
      }
    }

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }

    return () => {
      map.remove();
    };
  }, [mapReady, L, places]);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div id="geo-map" className={styles.map} />
    </>
  );
}
