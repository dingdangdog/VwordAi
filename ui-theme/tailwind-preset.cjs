/**
 * VwordAi Tailwind 预设（home 与 electron-client 共用）
 * 只依赖 tokens.css 中的 CSS 变量，不依赖任何 npm 包，两端通过相对路径引用。
 */

const c = (name) => `rgb(var(--vw-${name}) / <alpha-value>)`;
const v = (name, alpha) =>
  alpha === undefined ? `rgb(var(--vw-${name}))` : `rgb(var(--vw-${name}) / ${alpha})`;

const fontSans = [
  '"PingFang SC"',
  '"Microsoft YaHei UI"',
  '"Microsoft YaHei"',
  '"Segoe UI"',
  "system-ui",
  "-apple-system",
  "sans-serif",
];
const fontMono = [
  '"Cascadia Code"',
  '"JetBrains Mono"',
  "Consolas",
  "ui-monospace",
  "SFMono-Regular",
  "monospace",
];

const ease = "cubic-bezier(0.2, 0, 0, 1)";

const chevron =
  "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%238B95A3' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")";

function vwordaiComponents({ addBase, addComponents, addUtilities }) {
  addBase({
    html: { colorScheme: "light" },
    "html.dark": { colorScheme: "dark" },
    body: {
      backgroundColor: v("canvas"),
      color: v("ink"),
      fontFamily: fontSans.join(", "),
      fontSize: "15px",
      lineHeight: "1.55",
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale",
    },
    "::selection": { backgroundColor: v("accent", 0.28) },
    "*": {
      scrollbarWidth: "thin",
      scrollbarColor: `${v("line-strong")} transparent`,
    },
    "::-webkit-scrollbar": { width: "10px", height: "10px" },
    "::-webkit-scrollbar-track": { background: "transparent" },
    "::-webkit-scrollbar-thumb": {
      backgroundColor: v("line-strong"),
      border: "3px solid transparent",
      backgroundClip: "content-box",
      borderRadius: "999px",
    },
    "::-webkit-scrollbar-thumb:hover": { backgroundColor: v("ink-subtle") },
    ":focus-visible": {
      outline: `2px solid ${v("accent")}`,
      outlineOffset: "2px",
    },
    "input::placeholder, textarea::placeholder": { color: v("ink-subtle") },
    "@media (prefers-reduced-motion: reduce)": {
      "*, *::before, *::after": {
        animationDuration: "1ms !important",
        animationIterationCount: "1 !important",
        transitionDuration: "1ms !important",
        scrollBehavior: "auto !important",
      },
    },
  });

  const btnBase = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    height: "34px",
    padding: "0 14px",
    borderRadius: "6px",
    border: "1px solid transparent",
    fontSize: "14px",
    fontWeight: "500",
    lineHeight: "1",
    whiteSpace: "nowrap",
    userSelect: "none",
    cursor: "pointer",
    transitionProperty: "background-color, border-color, color, opacity",
    transitionDuration: "120ms",
    transitionTimingFunction: ease,
    "& > svg": { width: "16px", height: "16px", flexShrink: "0" },
    "&:disabled, &[aria-disabled='true']": {
      opacity: "0.45",
      cursor: "not-allowed",
    },
  };

  addComponents({
    ".btn": btnBase,
    ".btn-primary": {
      backgroundColor: v("accent"),
      color: v("accent-ink"),
      "&:hover:not(:disabled)": { backgroundColor: v("accent-hover") },
    },
    ".btn-secondary": {
      backgroundColor: v("raised"),
      borderColor: v("line-strong"),
      color: v("ink"),
      "&:hover:not(:disabled)": { backgroundColor: v("soft") },
    },
    ".btn-ghost": {
      backgroundColor: "transparent",
      color: v("ink-muted"),
      "&:hover:not(:disabled)": { backgroundColor: v("soft"), color: v("ink") },
    },
    ".btn-danger": {
      backgroundColor: v("danger", 0.12),
      color: v("danger"),
      "&:hover:not(:disabled)": { backgroundColor: v("danger", 0.2) },
    },
    ".btn-sm": {
      height: "30px",
      padding: "0 12px",
      fontSize: "13px",
      "& > svg": { width: "15px", height: "15px" },
    },
    ".btn-lg": { height: "42px", padding: "0 18px", fontSize: "15px" },
    ".btn-icon": { width: "34px", padding: "0" },
    ".btn-icon.btn-sm": { width: "30px", padding: "0" },
    ".btn-icon.btn-lg": { width: "42px", padding: "0" },

    ".field": {
      display: "block",
      width: "100%",
      height: "34px",
      padding: "0 12px",
      borderRadius: "6px",
      border: `1px solid ${v("line-strong")}`,
      backgroundColor: v("raised"),
      color: v("ink"),
      fontSize: "14px",
      lineHeight: "1.5",
      outline: "none",
      transitionProperty: "border-color, box-shadow",
      transitionDuration: "120ms",
      transitionTimingFunction: ease,
      "&:hover:not(:disabled):not(:focus)": { borderColor: v("ink-subtle") },
      "&:focus": {
        borderColor: v("accent"),
        boxShadow: `0 0 0 3px ${v("accent", 0.2)}`,
      },
      "&:disabled": { opacity: "0.55", cursor: "not-allowed" },
      "&[readonly]": { backgroundColor: v("soft") },
      "&[aria-invalid='true']": { borderColor: v("danger") },
    },
    "textarea.field, .field-area": {
      height: "auto",
      padding: "10px 12px",
      resize: "vertical",
    },
    "select.field": {
      appearance: "none",
      backgroundImage: chevron,
      backgroundPosition: "right 8px center",
      backgroundRepeat: "no-repeat",
      backgroundSize: "16px 16px",
      paddingRight: "30px",
    },
    ".field-sm": { height: "30px", fontSize: "13px", padding: "0 10px" },
    "select.field-sm": { paddingRight: "28px" },
    ".field-label": {
      display: "block",
      marginBottom: "6px",
      fontSize: "13px",
      fontWeight: "500",
      color: v("ink-muted"),
    },
    ".field-hint": { marginTop: "6px", fontSize: "13px", color: v("ink-subtle") },
    ".field-error": { marginTop: "6px", fontSize: "13px", color: v("danger") },

    ".panel": {
      backgroundColor: v("surface"),
      border: `1px solid ${v("line")}`,
      borderRadius: "10px",
    },
    ".panel-header": {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      minHeight: "44px",
      padding: "0 14px",
      borderBottom: `1px solid ${v("line")}`,
      fontSize: "14px",
      fontWeight: "600",
      color: v("ink"),
    },
    ".section-title": {
      fontSize: "12px",
      fontWeight: "600",
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color: v("ink-subtle"),
    },

    ".badge": {
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      height: "22px",
      padding: "0 8px",
      borderRadius: "4px",
      fontSize: "12px",
      fontWeight: "500",
      whiteSpace: "nowrap",
      backgroundColor: v("soft"),
      color: v("ink-muted"),
    },
    ".badge-accent": { backgroundColor: v("accent", 0.14), color: v("accent") },
    ".badge-success": { backgroundColor: v("success", 0.14), color: v("success") },
    ".badge-warning": { backgroundColor: v("warning", 0.14), color: v("warning") },
    ".badge-danger": { backgroundColor: v("danger", 0.14), color: v("danger") },
    ".badge-info": { backgroundColor: v("info", 0.14), color: v("info") },
    ".badge-live": { backgroundColor: v("live", 0.14), color: v("live") },

    ".kbd": {
      display: "inline-flex",
      alignItems: "center",
      height: "20px",
      padding: "0 6px",
      borderRadius: "4px",
      border: `1px solid ${v("line-strong")}`,
      backgroundColor: v("raised"),
      color: v("ink-muted"),
      fontFamily: fontMono.join(", "),
      fontSize: "12px",
      lineHeight: "1",
    },

    ".nav-item": {
      position: "relative",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      height: "36px",
      padding: "0 12px",
      borderRadius: "6px",
      fontSize: "14px",
      fontWeight: "500",
      color: v("ink-muted"),
      transitionProperty: "background-color, color",
      transitionDuration: "120ms",
      "& > svg": { width: "18px", height: "18px", flexShrink: "0" },
      "&:hover": { backgroundColor: v("soft"), color: v("ink") },
    },
    ".nav-item-active": {
      backgroundColor: v("accent", 0.12),
      color: v("ink"),
      "& > svg": { color: v("accent") },
      "&::before": {
        content: '""',
        position: "absolute",
        left: "-8px",
        top: "8px",
        bottom: "8px",
        width: "3px",
        borderRadius: "0 3px 3px 0",
        backgroundColor: v("accent"),
      },
    },

    ".tab": {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      height: "38px",
      padding: "0 2px",
      marginBottom: "-1px",
      borderBottom: "2px solid transparent",
      fontSize: "14px",
      fontWeight: "500",
      color: v("ink-muted"),
      "&:hover": { color: v("ink") },
    },
    ".tab-active": { borderBottomColor: v("accent"), color: v("ink") },

    ".status-dot": {
      display: "inline-block",
      width: "8px",
      height: "8px",
      borderRadius: "999px",
      flexShrink: "0",
      backgroundColor: v("ink-subtle"),
    },

    ".list-row": {
      display: "flex",
      alignItems: "center",
      gap: "14px",
      minHeight: "48px",
      padding: "10px 14px",
      borderBottom: `1px solid ${v("line")}`,
      transitionProperty: "background-color",
      transitionDuration: "120ms",
      "&:last-child": { borderBottom: "0" },
      "&:hover": { backgroundColor: v("soft") },
    },
  });

  addUtilities({
    ".num": {
      fontFamily: fontMono.join(", "),
      fontVariantNumeric: "tabular-nums",
    },
  });
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        canvas: c("canvas"),
        surface: c("surface"),
        raised: c("raised"),
        soft: c("soft"),
        line: { DEFAULT: c("line"), strong: c("line-strong") },
        ink: { DEFAULT: c("ink"), muted: c("ink-muted"), subtle: c("ink-subtle") },
        accent: { DEFAULT: c("accent"), hover: c("accent-hover"), ink: c("accent-ink") },
        success: c("success"),
        warning: c("warning"),
        danger: c("danger"),
        info: c("info"),
        live: c("live"),
        scrim: c("scrim"),
        role: {
          1: c("role-1"),
          2: c("role-2"),
          3: c("role-3"),
          4: c("role-4"),
          5: c("role-5"),
          6: c("role-6"),
          7: c("role-7"),
          8: c("role-8"),
        },
      },
      fontFamily: { sans: fontSans, mono: fontMono },
      fontSize: { "2xs": ["12px", "18px"], xs: ["13px", "18px"], sm: ["14px", "22px"] },
      borderRadius: { sm: "4px", md: "6px", lg: "10px" },
      boxShadow: {
        overlay: "0 12px 32px -8px rgb(0 0 0 / 0.35), 0 2px 6px rgb(0 0 0 / 0.12)",
      },
      transitionDuration: { fast: "120ms", base: "200ms" },
      transitionTimingFunction: { standard: ease },
      keyframes: {
        "vw-wave": {
          "0%, 100%": { transform: "scaleY(0.35)" },
          "50%": { transform: "scaleY(1)" },
        },
        "vw-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
        "vw-pop": {
          from: { opacity: "0", transform: "translateY(4px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "vw-fade": { from: { opacity: "0" }, to: { opacity: "1" } },
      },
      animation: {
        wave: "vw-wave 1s ease-in-out infinite",
        "pulse-dot": "vw-pulse 1.4s ease-in-out infinite",
        pop: `vw-pop 200ms ${ease}`,
        fade: `vw-fade 200ms ${ease}`,
      },
    },
  },
  plugins: [vwordaiComponents],
};
