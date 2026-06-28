import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "var(--bg-primary)",
        foreground: "var(--text-primary)",
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          light: "var(--primary-light)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          light: "var(--accent-light)",
        },
        success: {
          DEFAULT: "var(--success)",
          light: "var(--success-light)",
        },
        danger: {
          DEFAULT: "var(--danger)",
          light: "var(--danger-light)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          light: "var(--warning-light)",
        },
        card: {
          DEFAULT: "var(--bg-card)",
          hover: "var(--bg-card-hover)",
        },
        muted: "var(--text-muted)",
        secondary: "var(--text-secondary)",
        border: "var(--border)",
      },
    },
  },
  plugins: [],
};
export default config;
