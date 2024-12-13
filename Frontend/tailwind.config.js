/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      animation: {
        "custom-bounce1":
          "customBounce1 5s cubic-bezier(0.42, 0, 0.58, 1) infinite",
        "custom-bounce2":
          "customBounce2 5s cubic-bezier(0.42, 0, 0.58, 1) infinite",
      },
      keyframes: {
        customBounce1: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-30px)" }, // Adjust the intensity of the bounce
        },
        customBounce2: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(30px)" }, // Adjust the intensity of the bounce
        },
      },
    },
    screens: {
      sm: "400px", // Change `sm` breakpoint to 500px
      md: "768px", // Other breakpoints can remain as is
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
  },
  plugins: [],
};

