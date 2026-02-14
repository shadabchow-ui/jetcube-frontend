export const R2_BASE =
  'https://pub-efc133d84c664ca8ace8be57ec3e4d65.r2.dev';

export function joinUrl(base: string, path: string): string {
  const b = base.replace(/\/+$/, "");
  const p = path.replace(/^\/+/, "");
  return `${b}/${p}`;
}
