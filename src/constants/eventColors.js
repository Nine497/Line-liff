// Curated task-type palette — chosen (not admin-picked) so every event type
// reads as part of the same design system: each swatch is a deep, similarly
// saturated tone that resolves to white chip text via getContrastText, so
// typography stays uniform no matter which type is shown. Hues stay clear of
// the app's semantic green/red (used for ว่าง/ไม่ว่าง availability) so a task
// type is never mistaken for an availability status.
const EVENT_PALETTE = [
  { name: "navy", hex: "#0B3D6B" },
  { name: "amber", hex: "#92400E" },
  { name: "teal", hex: "#0F766E" },
  { name: "indigo", hex: "#4338CA" },
  { name: "violet", hex: "#6D28D9" },
  { name: "pink", hex: "#BE185D" },
  { name: "slate", hex: "#475569" },
];

function hashKey(key) {
  const str = String(key);
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash);
}

// Assigns each task type a stable color from the curated palette (by id,
// falling back to name) instead of trusting an arbitrary admin-picked hex —
// keeps every event on-brand while still letting types stay distinguishable.
export function getEventColor(type) {
  if (!type) return EVENT_PALETTE[0].hex;

  const key = type.id ?? type.name ?? "default";
  return EVENT_PALETTE[hashKey(key) % EVENT_PALETTE.length].hex;
}
