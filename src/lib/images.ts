/** src\lib\images.ts - utilidades */

const uploadsBase = (import.meta.env.VITE_UPLOADS_BASE_URL as string | undefined ?? '')
  .trim()
  .replace(/\/+$/, '');

export function publicImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  if (!uploadsBase) return null;
  return `${uploadsBase}/${path.replace(/^\/+/, '')}`;
}
