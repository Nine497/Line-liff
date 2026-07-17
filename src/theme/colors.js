// Single source of truth for the navy government/duty-ops palette.
// These hex values MUST stay identical to the CSS custom properties in
// `src/index.css` (:root / .dark) — antd's ConfigProvider needs plain JS
// values at theme-build time, so it can't consume the CSS variables directly.
// If you change a color here, mirror it in index.css (and vice versa).
export const navyLight = {
  colorPrimary: "#0B3D6B",
  colorSuccess: "#147D53",
  colorWarning: "#0B3D6B",
  colorError: "#C0392B",
  colorInfo: "#0B3D6B",
  colorLink: "#0B3D6B",
  borderRadius: 12,
  fontFamily: '"IBM Plex Sans Thai", sans-serif',
  colorBgContainer: "#FFFFFF",
  colorBgElevated: "#FFFFFF",
  colorBgLayout: "#F5F7FB",
  colorBorder: "rgba(16, 27, 45, 0.16)",
  colorBorderSecondary: "rgba(16, 27, 45, 0.09)",
  colorText: "#101B2D",
  colorTextSecondary: "#5B6B84",
  colorTextTertiary: "#8592A6",
};

export const navyDark = {
  colorPrimary: "#5B9BD5",
  colorSuccess: "#4FBE95",
  colorWarning: "#5B9BD5",
  colorError: "#E1786A",
  colorInfo: "#5B9BD5",
  colorLink: "#5B9BD5",
  borderRadius: 12,
  fontFamily: '"IBM Plex Sans Thai", sans-serif',
  colorBgContainer: "#10233A",
  colorBgElevated: "#132A45",
  colorBgLayout: "#0A1826",
  colorBorder: "rgba(232, 238, 246, 0.22)",
  colorBorderSecondary: "rgba(232, 238, 246, 0.10)",
  colorText: "#E8EEF6",
  colorTextSecondary: "#93A9C2",
  colorTextTertiary: "#6D84A0",
};
