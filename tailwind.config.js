module.exports = {
  future: {
    // removeDeprecatedGapUtilities: true,
    // purgeLayersByDefault: true,
  },
  purge: [
    {
      enabled: true,
      content: ['./dist/*.html', './src/pug/index.pug'],
    },
  ],
  theme: {
    screens: {
      skills2: '430px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
    extend: {},
  },
  variants: {
    backgroundColor: ['responsive', 'hover', 'focus', 'active'],
    textColor: ['responsive', 'hover', 'focus', 'active'],
  },
  plugins: [],
};
