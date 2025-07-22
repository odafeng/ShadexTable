/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0F2844",       // 深藍
        accent: "#A8DADC",        // 湖水綠
        background: "#F8FAFC",    // 奶油白
        muted: "#E2E8F0",         // 邊線灰
      },
      fontSize: {
        base: '18px',
      },
    },
  },
  plugins: [],
};
