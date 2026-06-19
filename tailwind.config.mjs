/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Navy → blue, mirroring the EDU Audit+ app icon (magnifying glass on a
        // navy-to-blue gradient). Distinct from EDU Mileage+'s teal.
        brand: {
          50:  '#eef5fc',
          100: '#d5e6f7',
          200: '#aecdee',
          300: '#7faedf',
          400: '#5189cd',
          500: '#316bb4',
          600: '#27559a',
          700: '#22467c',
          800: '#1d3b66',
          900: '#142844',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"Segoe UI"', 'Roboto', 'system-ui', 'sans-serif'],
        display: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"Segoe UI"', 'Roboto', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
    },
  },
  plugins: [],
};
