import { getFrequentContacts, type ActionResult } from "@/app/actions";
import type { FrequentContact } from "@/types";

/** Caché en memoria de `getFrequentContacts`, compartida entre los diálogos de invitación. */

let cached: Promise<ActionResult<FrequentContact[]>> | null = null;
let cachedAt = 0;
const TTL_MS = 60_000;

export function getCachedFrequentContacts(): Promise<
  ActionResult<FrequentContact[]>
> {
  const isStale = Date.now() - cachedAt > TTL_MS;
  if (!cached || isStale) {
    cachedAt = Date.now();
    cached = getFrequentContacts().then((res) => {
      if (res.error) cached = null;
      return res;
    });
  }
  return cached;
}

/** Se llama tras invitar a alguien, para que la próxima carga esté al día. */
export function invalidateFrequentContactsCache() {
  cached = null;
}
