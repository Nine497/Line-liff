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
  colorBgContainer: "#141414",
  colorBgElevated: "#1C1C1C",
  colorBgLayout: "#000000",
  colorBorder: "rgba(255, 255, 255, 0.18)",
  colorBorderSecondary: "rgba(255, 255, 255, 0.09)",
  colorText: "#F2F2F2",
  colorTextSecondary: "#9A9A9A",
  colorTextTertiary: "#707070",
};
