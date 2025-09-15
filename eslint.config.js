import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  unocss: true,
  vue: true,
  rules: {
    'no-console': 'off',
    'no-alert': 'off',
  },
  ignores: [
    '.github',
  ],
})
