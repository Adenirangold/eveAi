/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        Outfit: ["Outfit-Regular"],
        OutfitBold: ["Outfit-Bold"],
        OutfitLight: ["Outfit-Light"],
        OutfitExtraLight: ["Outfit-ExtraLight"],
        OutfitMedium: ["Outfit-Medium"],
        OutfitSemiBold: ["Outfit-SemiBold"],
      },
      colors: {
        typo: {
          neutral: "#FAFAFA",
          neutralLight: "#E5E5E5",
        },
      },
    },
  },
  plugins: [],
};
