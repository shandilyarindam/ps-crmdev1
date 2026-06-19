export type MapTheme = "dark" | "light";

export function getMapStyle(theme: MapTheme): string {
  if (theme === "dark") {
    return "https://tiles.openfreemap.org/styles/dark";
  }
  return "https://tiles.openfreemap.org/styles/positron";
}
