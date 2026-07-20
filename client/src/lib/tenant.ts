// Tracks which estate (tenant) this browser is acting on. The organizer sets
// it at login; participants pick it up from the first entity they load via
// their private link. Sent as the `x-estate-id` header on every API call.
const KEY = "heirloom-estate-id";

export function getEstateId(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setEstateId(id: string | null) {
  try {
    if (id) localStorage.setItem(KEY, id);
    else localStorage.removeItem(KEY);
  } catch {
    /* ignore storage errors (private mode, etc.) */
  }
}
