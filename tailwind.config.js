const { fontFamily } = require("tailwindcss/defaultTheme");

module.exports = {
  mode: "jit",
  purge: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Montserrat", ...fontFamily.sans],
      },
      borderRadius: {
        DEFAULT: "8px",
        secondary: "4px",
        container: "12px",
      },
      boxShadow: {
        DEFAULT: "0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)",
        hover: "0 4px 12px rgba(0,0,0,0.10)",
        card: "0 1px 3px rgba(0,0,0,0.06)",
      },
      colors: {
        primary: {
          DEFAULT: "#008DD0",
          hover: "#0079B5",
        },
        secondary: {
          DEFAULT: "#EE8220",
          hover: "#D4721C",
        },
        accent: {
          DEFAULT: "#4DBBA0",
          hover: "#3DA88E",
        },
        brand: {
          gray: "#5D5E60",
          dark: "#222222",
        },
      },
      spacing: {
        "form-field": "16px",
        section: "32px",
      },
    },
  },
  variants: {
    extend: {
      boxShadow: ["hover", "active"],
    },
  },
};
