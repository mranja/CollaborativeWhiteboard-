module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#6d28d9',
        accent: '#06b6d4'
      },
      boxShadow: {
        'soft': '0 8px 30px rgba(2,6,23,0.6)'
      },
      backdropBlur: {
        xs: '4px'
      }
    }
  },
  plugins: []
}
module.exports = {
  content: ['./index.html','./src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: { extend: {} },
  plugins: []
}
