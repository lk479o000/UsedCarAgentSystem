Component({
  data: {
    selected: 0,
    pillStyle: '',
    color: '#94A3B8',
    selectedColor: '#0EA5E9',
    list: [
      { pagePath: 'pages/index/index', text: '首页', icon: 'i-lucide-home' },
      { pagePath: 'pages/leads/leads', text: '线索', icon: 'i-lucide-list' },
      { pagePath: 'pages/settlements/settlements', text: '结算', icon: 'i-lucide-hand-coins' },
      { pagePath: 'pages/profile/profile', text: '我的', icon: 'i-lucide-user' },
    ],
  },
  observers: {
    'selected': function(selected) {
      this.updatePill(selected)
    }
  },
  lifetimes: {
    attached() {
      this.updateSelected()
    },
  },
  pageLifetimes: {
    show() {
      this.updateSelected()
    },
  },
  methods: {
    updatePill(selected) {
      const count = this.data.list.length || 1
      const safeSelected = Math.max(0, Math.min(count - 1, Number(selected) || 0))
      this.setData({
        pillStyle: `transform: translateX(${safeSelected * 100}%); width: ${100 / count}%;`,
      })
    },
    updateSelected() {
      const pages = getCurrentPages()
      const current = pages[pages.length - 1]
      const rawRoute = current ? (current.route || current.__route__ || '') : ''
      if (!rawRoute) return
      const route = rawRoute.split('?')[0].replace(/^\//, '')
      const idx = this.data.list.findIndex((item) => item.pagePath === route)
      if (idx >= 0) {
        this.setData({ selected: idx })
        this.updatePill(idx)
      }
    },
    onTabTap(e) {
      const index = Number(e.currentTarget.dataset.index)
      const item = this.data.list[index]
      if (!item) return
      const pages = getCurrentPages()
      const current = pages[pages.length - 1]
      const rawRoute = current ? (current.route || current.__route__ || '') : ''
      const route = rawRoute.split('?')[0].replace(/^\//, '')
      if (item.pagePath === route) return
      this.setData({ selected: index })
      this.updatePill(index)
      wx.switchTab({ url: `/${item.pagePath}` })
    },
  },
})

