import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

// 导入全局组件
import * as baseComponents from '@/components/base'
import * as businessComponents from '@/components/business'

// 导入全局指令
import { vPermission } from '@/directives/permission'

// 导入日志服务
import { logService } from '@/services/log'

export function createApp() {
  const app = createSSRApp(App)

  // 创建 Pinia 实例
  const pinia = createPinia()
  app.use(pinia)

  // 注册全局基础组件
  Object.entries(baseComponents).forEach(([name, component]) => {
    if (name.startsWith('M') && typeof component === 'object') {
      app.component(name, component)
    }
  })

  // 注册全局业务组件
  Object.entries(businessComponents).forEach(([name, component]) => {
    if (name.startsWith('M') && typeof component === 'object') {
      app.component(name, component)
    }
  })

  // 注册全局指令
  app.directive('permission', vPermission)

  // 全局错误处理
  app.config.errorHandler = (err, instance, info) => {
    // 记录错误日志
    logService.error('Vue Error', err as Error, {
      componentName: instance?.$options?.name || 'Unknown',
      info,
    })

    // 在开发环境下打印错误
    if (process.env.NODE_ENV === 'development') {
      console.error('Vue Error:', err)
      console.error('Component:', instance)
      console.error('Info:', info)
    }
  }

  // 全局警告处理（仅开发环境）
  if (process.env.NODE_ENV === 'development') {
    app.config.warnHandler = (msg, instance, trace) => {
      console.warn('Vue Warning:', msg)
      if (trace) {
        console.warn('Trace:', trace)
      }
    }
  }

  // 全局 Promise 未捕获错误处理
  if (typeof uni !== 'undefined' && uni.onUnhandledRejection) {
    uni.onUnhandledRejection((res: { reason: string }) => {
      logService.error('Unhandled Rejection', new Error(res.reason))
    })
  }

  return {
    app,
  }
}
