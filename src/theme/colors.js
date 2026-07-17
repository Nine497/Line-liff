// Single source of truth for antd's theme tokens. These hex values MUST
// stay identical to the CSS custom properties in `src/index.css` (:root /
// .dark) — antd's ConfigProvider needs plain JS values at theme-build time,
// so it can't consume the CSS variables directly.
// If you change a color here, mirror it in index.css (and vice versa).
export const navyLight = {
  colorPrimary: "#2563EB",
  colorSuccess: "#10B981",
  colorWarning: "#2563EB",
  colorError: "#EF4444",
  colorInfo: "#2563EB",
  colorLink: "#2563EB",
  borderRadius: 12,
  fontFamily: '"Sarabun", sans-serif',
  colorBgContainer: "#FFFFFF",
  colorBgElevated: "#FFFFFF",
  colorBgLayout: "#F8FAFC",
  colorBorder: "#CBD5E1",
  colorBorderSecondary: "#E2E8F0",
  colorText: "#0F172A",
  colorTextSecondary: "#64748B",
  colorTextTertiary: "#94A3B8",
};

export const navyDark = {
  colorPrimary: "#3B82F6",
  colorSuccess: "#34D399",
  colorWarning: "#3B82F6",
  colorError: "#F87171",
  colorInfo: "#3B82F6",
  colorLink: "#3B82F6",
  borderRadius: 12,
  fontFamily: '"Sarabun", sans-serif',
  colorBgContainer: "#131B2E",
  colorBgElevated: "#161F35",
  colorBgLayout: "#0A0F1D",
  colorBorder: "rgba(148, 163, 184, 0.28)",
  colorBorderSecondary: "rgba(148, 163, 184, 0.14)",
  colorText: "#E8ECF4",
  colorTextSecondary: "#8A97AF",
  colorTextTertiary: "#64708A",
};
