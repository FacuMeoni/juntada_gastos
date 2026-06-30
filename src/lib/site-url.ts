/** Origin público del sitio. En el browser usa el puerto real (p. ej. 3001). */
export function getSiteOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SITE_URL ?? "";
}

export function inviteUrl(eventId: string): string {
  return `${getSiteOrigin()}/invite/${eventId}`;
}
