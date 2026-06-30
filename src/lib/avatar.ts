/** URL de foto subida por el usuario. Ignora avatares Vercel legados. */
export function customAvatarUrl(
  url: string | null | undefined,
): string | null {
  if (!url?.trim() || url.includes("avatar.vercel.sh")) return null;
  return url;
}
