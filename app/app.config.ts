export default defineAppConfig({
  ui: {
    colors: {
      primary: 'green',
      neutral: 'mist',
    },
    page: {
      slots: {
        root: 'flex flex-col lg:grid lg:grid-cols-12 lg:gap-6',
        left: 'lg:col-span-2',
        center: 'lg:col-span-6',
        right: 'lg:col-span-4 order-first lg:order-last',
      },
    },
  },
})
