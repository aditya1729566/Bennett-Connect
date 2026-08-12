export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function usernameFromName(name: string) {
  const base = slugify(name).replace(/-/g, "");
  return base || `student${Date.now()}`;
}
