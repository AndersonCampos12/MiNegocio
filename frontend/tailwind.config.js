/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{html,ts}",
    ],
    theme: {
        extend: {
            colors: {
                turquesa: '#00BCD4',
                fondoOscuro: '#0A0A0A',
            }
        },
    },
    plugins: [],
}