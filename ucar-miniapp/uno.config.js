const { defineConfig } = require('unocss')
const presetWeapp = require('unocss-preset-weapp').default
const { transformerClass } = require('unocss-preset-weapp/transformer')
const presetIcons = require('@unocss/preset-icons').default

const include = [/\.wxml$/]

module.exports = defineConfig({
  content: { 
    filesystem: [
      '**/*.wxml',
      '**/*.js',
    ],
    pipeline: { include } 
  },
  presets: [
    presetWeapp(),
    presetIcons({
      collections: {
        lucide: () => require('@iconify-json/lucide').icons,
      },
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
    }),
  ],
  safelist: [
    'i-lucide-lock',
    'i-lucide-file-text',
    'i-lucide-shield',
    'i-lucide-chevron-right',
    'i-lucide-user',
    'i-lucide-wallet',
    'i-lucide-list',
    'i-lucide-check',
    'i-lucide-log-out',
    'i-lucide-refresh-cw',
    'i-lucide-smartphone',
    'i-lucide-activity',
    'i-lucide-home',
    'i-lucide-hand-coins',
    'i-lucide-search',
    'i-lucide-x',
    'i-lucide-calendar',
    'i-lucide-inbox',
    'i-lucide-sliders-horizontal',
    'i-lucide-clock',
    'i-lucide-check-circle',
    'i-lucide-x-circle',
    'i-lucide-hourglass',
    'i-lucide-chevron-down',
    'i-lucide-edit',
    'i-lucide-trash-2',
    'i-lucide-map-pin',
    'i-lucide-eye',
    'i-lucide-eye-off',
    'i-lucide-lock-keyhole',
  ],
  transformers: [transformerClass({ include, classTags: false })],
  separators: '__',
})
