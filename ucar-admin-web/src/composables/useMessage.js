let seed = 0
const instances = new Map()

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

// 更新消息位置
function updateMessagePositions() {
  const messages = Array.from(instances.values())
  messages.forEach((message, index) => {
    message.style.top = `${30 + index * 70}px` // 30px 是第一条消息的顶部位置，70px 是每个消息的大致高度
  })
}

function createMessage(type) {
  return (message) => {
    console.log(`Message.${type} called with:`, message)
    const id = `message-${++seed}`
    
    // 使用原生DOM操作创建消息框
    const messageElement = document.createElement('div')
    messageElement.id = id
    messageElement.className = `min-w-[300px] h-auto rounded-md border px-6 py-3.5 shadow-lg flex items-center gap-3 font-medium text-sm ${bgMap[type]}`
    messageElement.style.display = 'block'
    messageElement.style.visibility = 'visible'
    messageElement.style.opacity = '1'
    // 计算左边菜单的宽度，默认为240px
    const menuWidth = 240
    
    messageElement.style.position = 'fixed'
    messageElement.style.top = '50%'
    messageElement.style.left = '50%'
    messageElement.style.transform = 'translate(-50%, -50%)'
    messageElement.style.zIndex = '500'
    
    // 创建图标元素
    const iconElement = document.createElement('span')
    iconElement.className = `text-lg ${iconMap[type]}`
    
    // 创建文本元素
    const textElement = document.createElement('span')
    textElement.textContent = message
    
    // 组装消息框
    messageElement.appendChild(iconElement)
    messageElement.appendChild(textElement)
    
    console.log('Creating message element:', messageElement)
    document.body.appendChild(messageElement)
    console.log('Message element appended to body')
    
    instances.set(id, messageElement)
    
    // 更新消息位置
    updateMessagePositions()
    
    // 自动关闭
    setTimeout(() => {
      console.log('Closing message:', id)
      if (messageElement.parentNode) {
        // 添加淡出动画
        messageElement.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out'
        messageElement.style.opacity = '0'
        messageElement.style.transform = 'translateX(100%) scale(0.9)'
        
        // 动画结束后移除元素
        setTimeout(() => {
          if (messageElement.parentNode) {
            messageElement.parentNode.removeChild(messageElement)
            instances.delete(id)
            // 更新其他消息的位置
            updateMessagePositions()
          }
        }, 300)
      }
    }, 3000)
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
