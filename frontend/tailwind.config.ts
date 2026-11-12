import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        clinical: {
          navy: "#0F172A",
          deepBlue: "#1E3A8A",
          primary: "#2563EB",
          primaryHover: "#1D4ED8",
          teal: "#0D9488",
          tealLight: "#CCFBF1",
          slate: "#334155",
          muted: "#64748B",
          border: "#E2E8F0",
          cardBg: "#FFFFFF",
          pageBg: "#F8FAFC",
          success: "#16A34A",
          successBg: "#F0FDF4",
          warning: "#D97706",
          warningBg: "#FFFBEB",
          danger: "#DC2626",
          dangerBg: "#FEF2F2",
        },
      },
    },
  },
  plugins: [],
};
export default config;
