import preset from "../../ui-theme/tailwind-preset.cjs";

/** @type {import('tailwindcss').Config} */
export default {
  presets: [preset],
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
};
