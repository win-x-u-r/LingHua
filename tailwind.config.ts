import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          glow: "hsl(var(--primary-glow))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        sunshine: {
          DEFAULT: "hsl(var(--sunshine))",
          foreground: "hsl(var(--sunshine-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          soft: "hsl(var(--success-soft))",
          foreground: "hsl(var(--success-foreground))",
        },
        stroke: "hsl(var(--stroke))",
        header: {
          DEFAULT: "hsl(var(--header))",
          foreground: "hsl(var(--header-foreground))",
          hover: "hsl(var(--header-hover))",
        },
        footer: {
          DEFAULT: "hsl(var(--footer))",
          foreground: "hsl(var(--footer-foreground))",
          muted: "hsl(var(--footer-muted))",
        },
        stamp: "hsl(var(--stamp))",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        zh: ["var(--font-zh)"],
      },
      backgroundImage: {
        'gradient-coral': 'var(--gradient-coral)',
        'gradient-mint': 'var(--gradient-mint)',
        'gradient-lavender': 'var(--gradient-lavender)',
        'gradient-rainbow': 'var(--gradient-rainbow)',
      },
      boxShadow: {
        'soft': 'var(--shadow-soft)',
        'glow': 'var(--shadow-glow)',
        'stamp': '5px 5px 0 hsl(var(--stamp))',
        'stamp-sm': '3px 3px 0 hsl(var(--stamp))',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
