import { ref, h, render } from 'vue'

const MessageComponent = {
  props: ['type', 'message', 'onClose'],
  setup(props) {
    const visible = ref(true)
    const bgMap = {
      success: 'bg-success/10 border-success/20 text-teal-700',
      error: 'bg-danger/10 border-danger/20 text-red-700',
      warning: 'bg-warning/10 border-warning/20 text-amber-700',
      info: 'bg-primary/10 border-primary/20 text-primary-dark',
    }
    const iconMap = {
      success: 'i-lucide-circle-check',
      error: 'i-lucide-circle-x',
      warning: 'i-lucide-triangle-alert',
      info: 'i-lucide-info',
    }

    setTimeout(() => {
      visible.value = false
      setTimeout(() => props.onClose?.(), 300)
    }, 3000)

    return () =>
      h(
        'transition',
        {
          enterActiveClass: 'transition-all duration-300 ease-out',
          enterFromClass: 'opacity-0 translate-x-full scale-90',
          enterToClass: 'opacity-100 translate-x-0 scale-100',
          leaveActiveClass: 'transition-all duration-200 ease-in',
          leaveFromClass: 'opacity-100 translate-x-0 scale-100',
          leaveToClass: 'opacity-0 translate-x-full scale-90',
        },
        () =>
          visible.value
            ? h(
                'div',
                {
                  class: `fixed top-4 right-4 z-50 min-w-300px rounded-md border px-6 py-3.5 shadow-lg flex items-center gap-3 font-medium text-sm ${bgMap[props.type]}`,
                },
                [
                  h('span', { class: `text-lg ${iconMap[props.type]}` }),
                  h('span', null, props.message),
                ]
              )
            : null
      )
  },
}

let seed = 0
const instances = new Map()

function createMessage(type) {
  return (message) => {
    const id = `message-${++seed}`
    const container = document.createElement('div')
    container.id = id
    document.body.appendChild(container)

    const vnode = h(MessageComponent, {
      type,
      message,
      onClose: () => {
        render(null, container)
        document.body.removeChild(container)
        instances.delete(id)
      },
    })

    render(vnode, container)
    instances.set(id, { container, vnode })
  }
}

export const Message = {
  success: createMessage('success'),
  error: createMessage('error'),
  warning: createMessage('warning'),
  info: createMessage('info'),
}

export function useMessage() {
  return Message
}
