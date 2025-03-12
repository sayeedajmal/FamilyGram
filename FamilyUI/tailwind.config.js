/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}"], // ✅ Ensure all components are scanned
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        custom: ["SpaceMono"], // Default Regular
        "custom-bold": ["SpaceBold"], // Bold version
        "custom-italic": ["SpaceItalic"], // Italic version
      },
    },
  },
  plugins: [],
};
