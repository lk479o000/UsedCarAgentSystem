import { defineConfig } from 'unocss'
import presetWeapp from 'unocss-preset-weapp'
import { transformerClass } from 'unocss-preset-weapp/transformer'
import presetIcons from '@unocss/preset-icons'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

const include = [/\.wxml$/]

export default defineConfig({
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
