/**
 * Geography of the Kenyan Lake Victoria Basin used by the SIHU map.
 * Coordinates are approximate town / landmark centres (WGS84).
 */
export type BasinPlaceKind = "office" | "county" | "water" | "nature";

export type BasinPlace = {
  id: string;
  name: string;
  kind: BasinPlaceKind;
  lat: number;
  lng: number;
  summary: string;
};

export const BASIN_PLACE_KINDS: Record<BasinPlaceKind, { label: string; color: string }> = {
  office: { label: "SIHU office", color: "#0f172a" },
  county: { label: "Basin counties", color: "#0284c7" },
  water: { label: "Lake, rivers & wetlands", color: "#0891b2" },
  nature: { label: "Forests, hills & parks", color: "#16a34a" },
};

export const BASIN_PLACES: BasinPlace[] = [
  { id: "sihu-office", name: "SIHU office, Busia", kind: "office", lat: 0.4608, lng: 34.1115, summary: "Sango Information Hub, Fort Jesus Road, Busia Town. Our newsroom and community information centre." },

  { id: "busia", name: "Busia County", kind: "county", lat: 0.43, lng: 34.17, summary: "Border county on the Kenya–Uganda crossing, with lake shoreline at Port Victoria and Sio Port." },
  { id: "siaya", name: "Siaya County", kind: "county", lat: 0.0607, lng: 34.2881, summary: "Home of the Yala Swamp and Lake Kanyaboli; fishing and farming communities along the lake." },
  { id: "kisumu", name: "Kisumu County", kind: "county", lat: -0.0917, lng: 34.768, summary: "The basin's largest city, on the shores of the Winam Gulf." },
  { id: "homa-bay", name: "Homa Bay County", kind: "county", lat: -0.5273, lng: 34.4571, summary: "Lakeside county including Rusinga and Mfangano islands and Ruma National Park." },
  { id: "migori", name: "Migori County", kind: "county", lat: -1.0634, lng: 34.4731, summary: "Southern basin county bordering Tanzania, drained by the Migori and Kuja rivers." },
  { id: "kisii", name: "Kisii County", kind: "county", lat: -0.6817, lng: 34.7667, summary: "Highland county whose rivers feed the Gucha–Migori system into the lake." },
  { id: "nyamira", name: "Nyamira County", kind: "county", lat: -0.5633, lng: 34.9358, summary: "Highland catchment county with tea farming and tributaries of the Sondu–Miriu." },
  { id: "kakamega", name: "Kakamega County", kind: "county", lat: 0.2827, lng: 34.7519, summary: "Densely populated county, home of Kakamega Forest, drained by the Nzoia and Yala rivers." },
  { id: "vihiga", name: "Vihiga County", kind: "county", lat: 0.0767, lng: 34.7228, summary: "One of Kenya's most densely populated counties, in the Yala catchment." },
  { id: "bungoma", name: "Bungoma County", kind: "county", lat: 0.5635, lng: 34.5606, summary: "Stretches from Mt. Elgon to the Nzoia plains; a key upper catchment of the basin." },

  { id: "lake-victoria", name: "Lake Victoria (Sango)", kind: "water", lat: -0.75, lng: 33.6, summary: "Africa's largest freshwater lake, shared by Kenya, Uganda and Tanzania. Sango is its indigenous name." },
  { id: "winam-gulf", name: "Winam Gulf", kind: "water", lat: -0.28, lng: 34.5, summary: "Kenya's large, shallow gulf of the lake, affected by water hyacinth and pollution." },
  { id: "nzoia-mouth", name: "River Nzoia mouth, Port Victoria", kind: "water", lat: 0.0961, lng: 33.9765, summary: "The Nzoia, largest of the Kenyan sub-basins, enters the lake here; its lower basin is the most flood-prone area in Kenya." },
  { id: "yala-swamp", name: "Yala Swamp", kind: "water", lat: 0.0333, lng: 34.0833, summary: "Kenya's largest freshwater wetland, where the River Yala meets the lake." },
  { id: "sio-port", name: "Sio Port", kind: "water", lat: 0.2275, lng: 34.0203, summary: "Fishing port near the mouth of the River Sio on the Kenya–Uganda border." },

  { id: "mt-elgon", name: "Mt. Elgon", kind: "nature", lat: 1.1333, lng: 34.55, summary: "Extinct volcano on the Kenya–Uganda border; a water tower for the Nzoia and other rivers." },
  { id: "kakamega-forest", name: "Kakamega Forest", kind: "nature", lat: 0.2833, lng: 34.8667, summary: "Kenya's only tropical rainforest, part of the Yala and Nzoia catchments." },
  { id: "ruma", name: "Ruma National Park", kind: "nature", lat: -0.65, lng: 34.3, summary: "Protected savannah near Homa Bay, home of the endangered roan antelope." },
];

/** Facts about the Kenyan side of the basin (as published on the SIHU home page). */
export const BASIN_FACTS = [
  { value: "10", label: "counties in the Kenyan basin" },
  { value: "≈10%", label: "of Kenya's territory" },
  { value: "3", label: "countries share the lake" },
  { value: "700–2,000 mm", label: "annual rainfall, shore to highlands" },
];

export const BASIN_CENTER: [number, number] = [0.05, 34.35];
