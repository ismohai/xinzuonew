import defaultDarkThemeContent from "../themes/default-dark.css?raw";

// ============================================================================
// Types and Constants
// ============================================================================

const VALID_THEMES = ["system", "default", "default-dark"] as const;

export type Theme = (typeof VALID_THEMES)[number];
export type ResolvedTheme = Exclude<Theme, "system">;

export interface ThemeOption {
  value: string;
  label: string;
}

const STORAGE_KEY = "xinzuo-theme";
const STYLE_ELEMENT_ID = "instance-theme";

const THEME_CONTENT: Record<ResolvedTheme, string | null> = {
  default: null,
  "default-dark": defaultDarkThemeContent,
};

export const THEME_OPTIONS: ThemeOption[] = [
  { value: "system", label: "跟随系统" },
  { value: "default", label: "浅色" },
  { value: "default-dark", label: "深色" },
];

// ============================================================================
// Theme Validation and Detection
// ============================================================================

const validateTheme = (theme: string): Theme => {
  return VALID_THEMES.includes(theme as Theme) ? (theme as Theme) : "default";
};

export const getSystemTheme = (): ResolvedTheme => {
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "default-dark";
  }
  return "default";
};

export const resolveTheme = (theme: string): ResolvedTheme => {
  const validTheme = validateTheme(theme);
  return validTheme === "system" ? getSystemTheme() : validTheme;
};

// ============================================================================
// LocalStorage Helpers
// ============================================================================

const getStoredTheme = (): Theme | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored && VALID_THEMES.includes(stored as Theme) ? (stored as Theme) : null;
  } catch {
    return null;
  }
};

const setStoredTheme = (theme: Theme): void => {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // localStorage might not be available
  }
};

// ============================================================================
// Theme Selection with Fallbacks
// ============================================================================

export const getInitialTheme = (): Theme => {
  return getStoredTheme() ?? "default";
};

export const getThemeWithFallback = (userTheme?: string): Theme => {
  if (userTheme && VALID_THEMES.includes(userTheme as Theme)) {
    return userTheme as Theme;
  }
  const stored = getStoredTheme();
  if (stored) {
    return stored;
  }
  return "default";
};

// ============================================================================
// DOM Manipulation
// ============================================================================

const removeThemeStyle = (): void => {
  document.getElementById(STYLE_ELEMENT_ID)?.remove();
};

const injectThemeStyle = (theme: ResolvedTheme): void => {
  removeThemeStyle();

  if (theme === "default") {
    return; // Use base CSS for default (light) theme
  }

  const css = THEME_CONTENT[theme];
  if (css) {
    const style = document.createElement("style");
    style.id = STYLE_ELEMENT_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }
};

const setThemeAttribute = (theme: ResolvedTheme): void => {
  document.documentElement.setAttribute("data-theme", theme);
};

// ============================================================================
// Main Theme Loading
// ============================================================================

export const loadTheme = (themeName: string): void => {
  const validTheme = validateTheme(themeName);
  const resolvedTheme = resolveTheme(validTheme);

  injectThemeStyle(resolvedTheme);
  setThemeAttribute(resolvedTheme);
  setStoredTheme(validTheme);
};

export const applyThemeEarly = (): void => {
  const theme = getInitialTheme();
  loadTheme(theme);
};

// ============================================================================
// System Theme Listener
// ============================================================================

export const setupSystemThemeListener = (onThemeChange: () => void): (() => void) => {
  if (typeof window === "undefined" || !window.matchMedia) {
    return () => {};
  }

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener("change", onThemeChange);
    return () => mediaQuery.removeEventListener("change", onThemeChange);
  }

  return () => {};
};
