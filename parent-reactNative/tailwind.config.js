/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#0f172a", // Deep Navy
          secondary: "#1e293b",
          accent: "#3b82f6", // Vibrant Blue
          success: "#10b981",
          gold: "#f59e0b",
        },
      },
    },
  },
  plugins: [],
}
