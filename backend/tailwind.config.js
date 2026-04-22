const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/**/{views,js,css}/**/*.blade.php',
        './resources/**/{views,js,css}/**/*.js',
        './node_modules/laravel-vite-plugin/**/*.blade.php',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Instrument Sans"', ...defaultTheme.fontFamily.sans],
            },
        },
    },
    plugins: [],
};