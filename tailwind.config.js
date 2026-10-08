/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0B1622",
          50: "#F0F2F5",
          100: "#E0E4EA",
          200: "#C2C9D5",
          300: "#A3AFC0",
          400: "#8594AB",
          500: "#0B1622",
          600: "#09131D",
          700: "#070F18",
          800: "#050B13",
          900: "#03060D",
        },
        accent: {
          DEFAULT: "#FF7A00",
          50: "#FFF5E8",
          100: "#FFEBD1",
          200: "#FFD7A3",
          300: "#FFC375",
          400: "#FFAF47",
          500: "#FF7A00",
          600: "#CC6200",
          700: "#994A00",
          800: "#663100",
          900: "#331900",
        },
        steel: {
          DEFAULT: "#3A86B7",
          50: "#EAF3FA",
          100: "#D5E7F5",
          200: "#ABCEEB",
          300: "#80B6E0",
          400: "#569DD6",
          500: "#3A86B7",
          600: "#2E6B92",
          700: "#23506E",
          800: "#173549",
          900: "#0C1B25",
        },
        surface: {
          DEFAULT: "#F8F9FB",
          50: "#FFFFFF",
          100: "#F8F9FB",
          200: "#F1F3F6",
          300: "#E5E8EE",
          400: "#D1D6DF",
          500: "#B0B8C5",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      fontSize: {
        "display-xl": ["clamp(3rem, 8vw, 7.5rem)", { lineHeight: "0.95", letterSpacing: "-0.04em" }],
        "display-lg": ["clamp(2.5rem, 6vw, 5rem)", { lineHeight: "1", letterSpacing: "-0.03em" }],
        "display-md": ["clamp(2rem, 4vw, 3.25rem)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        glass: "0 4px 24px 0 rgba(0, 0, 0, 0.06)",
        "glass-lg": "0 12px 48px -8px rgba(0, 0, 0, 0.08)",
        glow: "0 0 30px rgba(255, 122, 0, 0.2)",
        "glow-soft": "0 0 60px rgba(255, 122, 0, 0.08)",
        depth: "0 10px 40px -10px rgba(0,0,0,0.08), 0 4px 12px -4px rgba(58,134,183,0.1)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(255,122,0,0.15)" },
          "50%": { boxShadow: "0 0 40px rgba(255,122,0,0.3)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "gradient-pan": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        scroll: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.6s ease-out forwards",
        "fade-up": "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) forwards",
        shimmer: "shimmer 8s linear infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "gradient-pan": "gradient-pan 12s ease infinite",
        scroll: "scroll 30s linear infinite",
      },
    },
  },
  plugins: [],
};
