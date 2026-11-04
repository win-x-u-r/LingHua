// Places near the learner, from OpenStreetMap (Overpass API). No key needed.
// The position is only sent with the search and is never stored.

export type PlaceKind = "halal" | "money" | "mosque";

export interface Place {
  id: string;
  kind: PlaceKind;
  lat: number;
  lon: number;
  /** Metres from the learner */
  distance: number;
  tags: Record<string, string>;
}

const ENDPOINTS = ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];

const FOOD = "restaurant|fast_food|cafe|food_court";

function query(lat: number, lon: number, radius: number) {
  const a = `(around:${radius},${lat},${lon})`;
  return `[out:json][timeout:25];
(
  nwr${a}["amenity"~"${FOOD}"]["diet:halal"~"yes|only"];
  nwr${a}["amenity"~"${FOOD}"]["cuisine"~"halal",i];
  nwr${a}["amenity"~"${FOOD}"]["name"~"清真|halal|حلال",i];
  nwr${a}["amenity"="bureau_de_change"];
  nwr${a}["amenity"="bank"];
  nwr${a}["amenity"="place_of_worship"]["religion"="muslim"];
);
out center tags 300;`;
}

/** Straight-line distance in metres */
export function distance(aLat: number, aLon: number, bLat: number, bLon: number) {
  const r = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(bLat - aLat);
  const dLon = rad(bLon - aLon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(h));
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function kindOf(tags: Record<string, string>): PlaceKind | null {
  if (tags.amenity === "place_of_worship") return "mosque";
  if (tags.amenity === "bureau_de_change" || tags.amenity === "bank") return "money";
  return "halal";
}

export async function findNearby(lat: number, lon: number, radius = 5000): Promise<Place[]> {
  let lastError: unknown;
  for (const url of ENDPOINTS) {
    try {
      const res = await fetch(url, { method: "POST", body: new URLSearchParams({ data: query(lat, lon, radius) }) });
      if (!res.ok) throw new Error(`Overpass ${res.status}`);
      const json: { elements: OverpassElement[] } = await res.json();
      const seen = new Set<string>();
      return json.elements
        .map((el) => {
          const pLat = el.lat ?? el.center?.lat;
          const pLon = el.lon ?? el.center?.lon;
          const tags = el.tags ?? {};
          const kind = kindOf(tags);
          if (pLat == null || pLon == null || !kind) return null;
          const id = `${el.type}/${el.id}`;
          if (seen.has(id)) return null;
          seen.add(id);
          return { id, kind, lat: pLat, lon: pLon, tags, distance: distance(lat, lon, pLat, pLon) };
        })
        .filter((p): p is Place => p !== null)
        .sort((a, b) => a.distance - b.distance);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

/** A place's name in the learner's language, with its Chinese name if different */
export function placeName(tags: Record<string, string>, language: "en" | "ar") {
  const main = tags[`name:${language}`] || tags["name:en"] || tags.name || "";
  const zh = tags["name:zh"] || (/[一-鿿]/.test(tags.name ?? "") ? tags.name : "");
  return { main, zh: zh && zh !== main ? zh : "" };
}

/* ───────── map links ───────── */

export const mapLinks = {
  place: (p: Place, name: string) => ({
    amap: `https://uri.amap.com/marker?position=${p.lon},${p.lat}&name=${encodeURIComponent(name)}&coordinate=wgs84&callnative=1`,
    google: `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lon}`,
    apple: `https://maps.apple.com/?ll=${p.lat},${p.lon}&q=${encodeURIComponent(name)}`,
  }),
  search: (zh: string, en: string, at?: { lat: number; lon: number }) => ({
    amap: `https://uri.amap.com/search?keyword=${encodeURIComponent(zh)}${at ? `&center=${at.lon},${at.lat}` : ""}&coordinate=wgs84&callnative=1&src=linghua`,
    baidu: at
      ? `https://api.map.baidu.com/place/search?query=${encodeURIComponent(zh)}&location=${at.lat},${at.lon}&radius=5000&coord_type=wgs84&output=html&src=webapp.linghua.move`
      : `https://map.baidu.com/search/${encodeURIComponent(zh)}`,
    google: at
      ? `https://www.google.com/maps/search/${encodeURIComponent(en)}/@${at.lat},${at.lon},14z`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${en} near me`)}`,
    apple: `https://maps.apple.com/?q=${encodeURIComponent(en)}${at ? `&sll=${at.lat},${at.lon}` : ""}`,
  }),
};
