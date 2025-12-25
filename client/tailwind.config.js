module.exports = {
    content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
    theme: {
        extend: {
            colors: {
                'f8-orange': '#ff7731',
                'f8-orange-hover': '#ff5722',
                'f8-dark': '#1e1e1e',
                'f8-dark-secondary': '#2c2d3a',
                'f8-dark-footer': '#1a1b1f',
                'f8-blue': '#4c7bff',
                'f8-purple': '#a24cff',
                'f8-pink': '#ff2d87',
                'f8-yellow': '#ffd600',
                'f8-text-gray': '#757575',
            },
            fontFamily: {
                'sans': ['SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
            },
            backgroundImage: {
                'gradient-purple-blue': 'linear-gradient(135deg, #7c3aed 0%, #4c7bff 100%)',
                'gradient-yellow-orange': 'linear-gradient(135deg, #ffd600 0%, #ff7731 100%)',
                'gradient-pink-orange': 'linear-gradient(135deg, #ff2d87 0%, #ff7731 100%)',
                'gradient-blue-purple': 'linear-gradient(135deg, #4c7bff 0%, #7c3aed 100%)',
            },
        },
    },
    plugins: [],
};
