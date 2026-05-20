/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        border: "rgba(226, 232, 240, 0.8)",
        background: "#F8FAFC",
        foreground: "#0F172A",
        primary: {
          DEFAULT: "#3C3489",
          foreground: "#FFFFFF",
          hover: "#2D266E",
          light: "#EEEDFE",
        },
        secondary: {
          DEFAULT: "#0EA5E9",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#FFB000", // Gold XP Color
          streak: "#FF5722", // Flame Orange Streak Color
          success: "#10B981", // Emerald success
          warning: "#F59E0B",
          info: "#3B82F6",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#0F172A",
        },
        muted: {
          DEFAULT: "#64748B",
          foreground: "#94A3B8",
        }
      },
      borderRadius: {
        xl: "1rem",
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Outfit", "system-ui", "sans-serif"],
      },
      boxShadow: {
        premium: "0 10px 30px -10px rgba(60, 52, 137, 0.08), 0 1px 3px rgba(0, 0, 0, 0.02)",
        gamified: "0 4px 6px -1px rgba(255, 176, 0, 0.1), 0 2px 4px -1px rgba(255, 176, 0, 0.06)",
        streak: "0 4px 12px -2px rgba(255, 87, 34, 0.15)",
        inset: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
      }
    },
  },
  plugins: [],
}
