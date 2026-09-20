import type { Config } from "tailwindcss";

// Design tokens seeded here so this becomes the shared design system
// referenced in Section 4/12 of the project spec doc as more domains
// and products are added.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#ffffff",
          ink: "#0b1220",
        },
      },
    },
  },
  plugins: [],
};

export default config;
