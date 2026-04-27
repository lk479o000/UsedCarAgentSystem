const { defineConfig } = require('unocss')
const presetWeapp = require('unocss-preset-weapp').default
const { transformerClass } = require('unocss-preset-weapp/transformer')
const presetIcons = require('@unocss/preset-icons').default

const include = [/\.wxml$/]

module.exports = defineConfig({
  content: { pipeline: { include } },
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
  transformers: [transformerClass({ include, classTags: false })],
  separators: '__',
})
