export type Theme = "dark" | "light";

export type ThemeContextValue = Readonly<{
  setTheme: (theme: Theme) => void;
  theme: Theme;
}>;
