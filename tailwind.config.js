/** @type {import('tailwindcss').Config} */
export default {
  purge: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  content: [],
  theme: {
    textColor: {
      white: '#FFF'
    },
    extend: {},
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
