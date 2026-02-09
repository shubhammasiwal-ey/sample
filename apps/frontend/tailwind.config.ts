/** @type {import('tailwindcss').Config} */
module.exports = {
  important: '.tailwind-scope',
  content: [
    './src/app/investor/**/*.{js,ts,jsx,tsx}',
    './src/components/(investor)/**/*.{js,ts,jsx,tsx}',
    './src/components/investor/**/*.{js,ts,jsx,tsx}',
    './src/components/ui/DynamicForm/**/*.{js,ts,jsx,tsx}',
  ],
  theme: { extend: {} },
  corePlugins: { preflight: false },
  plugins: [],
};
