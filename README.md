# MES/WMS 移动端框架

基于 UniApp + Vue3 + TypeScript 的企业级制造执行系统（MES）和仓储管理系统（WMS）移动端框架。支持编译到微信小程序、H5、Android 和 iOS 多端，专注于工业场景的移动端应用开发。

## 📋 目录

- [项目概述](#项目概述)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [核心功能](#核心功能)
- [API 文档](#api-文档)
- [使用示例](#使用示例)
- [测试](#测试)
- [部署](#部署)

## 🎯 项目概述

本框架是一个完整的企业级移动端解决方案，提供了：

- **完整的权限管理系统** - 基于角色的访问控制（RBAC）
- **HTTP 服务层** - 自动令牌注入、请求重试、错误处理
- **设备适配** - 支持手机、平板、PDA 等多种设备
- **页面构建器** - 动态配置页面渲染
- **业务功能模块** - 扫码、报工、库存、设备、异常处理
- **状态管理** - 基于 Pinia 的全局状态管理
- **离线支持** - 离线数据队列和自动同步
- **日志系统** - 完整的日志记录和错误追踪

## 🛠 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.x | 前端框架 |
| TypeScript | 5.x | 类型系统 |
| UniApp | 最新 | 跨端框架 |
| Pinia | 2.x | 状态管理 |
| Vite | 5.x | 构建工具 |
| Vitest | 1.x | 单元测试 |
| fast-check | 3.x | 属性测试 |

## 📁 项目结构

```
src/
├── api/                    # 接口定义
│   ├── modules/           # 按模块划分的接口
│   └── index.ts           # 接口统一导出
├── components/            # 组件库
│   ├── base/              # 基础组件（MButton、MInput、MCard、MList）
│   ├── business/          # 业务组件（MScanner、MTable、MForm、MWorkOrderCard、MLocationPicker）
│   └── index.ts           # 组件统一导出
├── composables/           # 组合式函数
│   ├── useAuth.ts         # 权限相关
│   ├── useDevice.ts       # 设备适配
│   ├── usePDA.ts          # PDA 专用功能
│   ├── useScanner.ts      # 扫码业务处理
│   ├── useWorkReport.ts   # 工序报工
│   ├── useInventory.ts    # 库存操作
│   ├── useEquipment.ts    # 设备状态
│   ├── useException.ts    # 异常处理
│   └── index.ts           # 统一导出
├── config/                # 配置文件
│   ├── app.config.ts      # 应用配置
│   └── theme.config.ts    # 主题配置
├── directives/            # 自定义指令
│   └── permission.ts      # 权限指令（v-permission）
├── pages/                 # 页面
│   ├── login/             # 登录页
│   ├── home/              # 首页
│   ├── profile/           # 个人中心
│   ├── dynamic/           # 动态页面容器
│   └── index/             # 默认页面
├── services/              # 服务层
│   ├── http/              # HTTP 服务
│   │   ├── index.ts       # 核心服务
│   │   ├── retry.ts       # 重试机制
│   │   └── token.ts       # 令牌管理
│   ├── auth/              # 认证服务
│   │   ├── index.ts       # 核心服务
│   │   └── guard.ts       # 路由守卫
│   ├── storage/           # 存储服务
│   ├── sync/              # 同步服务
│   └── log/               # 日志服务
├── store/                 # 状态管理
│   ├── modules/           # 状态模块
│   │   ├── user.ts        # 用户状态
│   │   └── app.ts         # 应用状态
│   └── index.ts           # 状态统一导出
├── types/                 # 类型定义
│   ├── http.ts            # HTTP 相关类型
│   ├── auth.ts            # 权限相关类型
│   ├── device.ts          # 设备相关类型
│   ├── page-builder.ts    # 页面构建器类型
│   ├── business.ts        # 业务数据模型
│   └── error.ts           # 错误处理类型
├── utils/                 # 工具函数
│   └── format.ts          # 格式化工具
├── page-builder/          # 页面构建器
│   ├── parser/            # 配置解析器
│   ├── renderer/          # 组件渲染器
│   └── index.ts           # 统一导出
├── styles/                # 全局样式
│   └── variables.scss     # 样式变量
├── App.vue                # 根组件
├── main.ts                # 应用入口
├── manifest.json          # 应用配置
├── pages.json             # 页面路由配置
└── uni.scss               # 全局样式变量
```

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0
- npm >= 8.0 或 yarn >= 1.22

### 安装依赖

```bash
cd mes-wms-mobile
npm install
```

### 开发模式

```bash
# H5 开发
npm run dev:h5

# 微信小程序开发
npm run dev:mp-weixin

# 编译到 Android
npm run dev:app-android

# 编译到 iOS
npm run dev:app-ios
```

### 构建生产版本

```bash
# H5 生产构建
npm run build:h5

# 微信小程序生产构建
npm run build:mp-weixin

# App 生产构建
npm run build:app
```

### 运行测试

```bash
# 运行所有测试
npm test

# 运行单次测试（CI 模式）
npm test -- --run

# 监听模式
npm test -- --watch
```

## 🎨 核心功能

### 1. 权限管理系统

完整的基于角色的访问控制（RBAC）系统。

**功能特性：**
- 用户认证和授权
- 角色和权限管理
- 页面级权限控制
- 按钮级权限控制
- 权限指令（v-permission）

**使用示例：**

```typescript
import { useAuth } from '@/composables/useAuth'

export default {
  setup() {
    const { hasPermission, hasRole } = useAuth()

    // 检查权限
    if (hasPermission('user:edit')) {
      // 用户有编辑权限
    }

    // 检查角色
    if (hasRole('admin')) {
      // 用户是管理员
    }

    return { hasPermission, hasRole }
  }
}
```

**权限指令：**

```vue
<!-- 只有拥有 user:edit 权限的用户才能看到这个按钮 -->
<button v-permission="'user:edit'">编辑</button>

<!-- 拥有多个权限中的任意一个即可 -->
<button v-permission="['user:edit', 'user:delete']">操作</button>
```

### 2. HTTP 服务层

智能的 HTTP 请求服务，包含自动令牌注入、请求重试、错误处理等功能。

**功能特性：**
- 自动令牌注入
- 请求拦截和响应处理
- 自动重试机制（最多3次，指数退避）
- 令牌过期自动刷新
- 请求取消机制
- 统一错误处理

**使用示例：**

```typescript
import { httpService } from '@/services/http'

// GET 请求
const data = await httpService.get('/api/users', { page: 1 })

// POST 请求
const result = await httpService.post('/api/users', {
  name: 'John',
  email: 'john@example.com'
})

// 自定义配置
const response = await httpService.request({
  url: '/api/data',
  method: 'GET',
  timeout: 10000,
  retry: 3,
  retryDelay: 1000
})

// 取消请求
const cancelToken = 'request-1'
httpService.cancel(cancelToken)
```

### 3. 设备适配

支持多种设备类型的自动适配。

**功能特性：**
- 自动设备类型检测（手机、平板、PDA）
- 响应式布局配置
- 屏幕尺寸监听
- PDA 专用功能支持

**使用示例：**

```typescript
import { useDevice } from '@/composables/useDevice'

export default {
  setup() {
    const { deviceInfo, layoutConfig, isPhone, isTablet, isPDA } = useDevice()

    return {
      deviceInfo,
      layoutConfig,
      isPhone,
      isTablet,
      isPDA
    }
  }
}
```

### 4. 业务功能模块

#### 4.1 扫码业务处理

支持条码和二维码的解析和业务数据关联。

**功能特性：**
- 条码/二维码自动识别
- 多种条码格式支持（物料码、库位码、工单码等）
- 扫码历史记录
- 手动输入支持

**使用示例：**

```typescript
import { useScanner } from '@/composables/useScanner'

export default {
  setup() {
    const {
      parseBarcode,
      startScan,
      inputBarcode,
      scanHistory,
      lastScanResult
    } = useScanner({
      onSuccess: (result) => {
        console.log('扫码成功:', result)
      },
      onError: (error) => {
        console.error('扫码失败:', error)
      }
    })

    // 开始扫码
    const handleScan = async () => {
      const result = await startScan()
      if (result) {
        console.log('扫码结果:', result)
      }
    }

    // 手动输入
    const handleInput = () => {
      const result = inputBarcode('M123456')
      console.log('解析结果:', result)
    }

    return { handleScan, handleInput, scanHistory, lastScanResult }
  }
}
```

#### 4.2 工序报工

完整的工序报工流程，包括工序选择、数量录入、质量检验。

**功能特性：**
- 工单选择
- 工序选择
- 数量录入
- 质检项管理
- 报工历史记录

**使用示例：**

```typescript
import { useWorkReport } from '@/composables/useWorkReport'

export default {
  setup() {
    const {
      selectWorkOrder,
      selectProcess,
      updateQuantity,
      updateQualityItem,
      submitReport,
      reportForm,
      canSubmit,
      qualifiedRate
    } = useWorkReport({
      onSubmit: async (report) => {
        // 提交报工
        return true
      }
    })

    // 选择工单
    const handleSelectWorkOrder = async () => {
      await selectWorkOrder('WO001')
    }

    // 选择工序
    const handleSelectProcess = async () => {
      await selectProcess('OP10')
    }

    // 更新数量
    const handleUpdateQuantity = () => {
      updateQuantity(100, 95) // 总数100，合格95
    }

    // 提交报工
    const handleSubmit = async () => {
      const success = await submitReport()
      if (success) {
        console.log('报工成功')
      }
    }

    return {
      handleSelectWorkOrder,
      handleSelectProcess,
      handleUpdateQuantity,
      handleSubmit,
      reportForm,
      canSubmit,
      qualifiedRate
    }
  }
}
```

#### 4.3 库存操作

支持入库、出库、移库、盘点等库存操作。

**功能特性：**
- 多种操作类型支持
- 物料和库位扫码
- 库存查询
- 盘点差异管理

**使用示例：**

```typescript
import { useInventory } from '@/composables/useInventory'

export default {
  setup() {
    const {
      setOperationType,
      scanMaterial,
      scanLocation,
      updateQuantity,
      submitOperation,
      operationForm,
      canSubmit,
      stocktakeSummary
    } = useInventory({
      onSubmit: async (operation) => {
        // 提交操作
        return true
      }
    })

    // 设置操作类型为入库
    const handleInbound = () => {
      setOperationType('inbound')
    }

    // 扫描物料
    const handleScanMaterial = async () => {
      await scanMaterial('M123456')
    }

    // 扫描库位
    const handleScanLocation = async () => {
      await scanLocation('A01-01-01')
    }

    // 更新数量
    const handleUpdateQuantity = () => {
      updateQuantity(100)
    }

    // 提交操作
    const handleSubmit = async () => {
      const success = await submitOperation()
      if (success) {
        console.log('操作成功')
      }
    }

    return {
      handleInbound,
      handleScanMaterial,
      handleScanLocation,
      handleUpdateQuantity,
      handleSubmit,
      operationForm,
      canSubmit,
      stocktakeSummary
    }
  }
}
```

#### 4.4 设备状态管理

实时展示和管理设备状态。

**功能特性：**
- 设备列表管理
- 实时状态监控
- 告警管理
- 自动刷新

**使用示例：**

```typescript
import { useEquipment } from '@/composables/useEquipment'

export default {
  setup() {
    const {
      loadEquipments,
      loadEquipmentDetail,
      loadAlarms,
      acknowledgeAlarm,
      filterByStatus,
      searchEquipments,
      startAutoRefresh,
      equipments,
      stats,
      faultEquipments
    } = useEquipment({
      refreshInterval: 30000 // 30秒刷新一次
    })

    // 加载设备列表
    const handleLoadEquipments = async () => {
      await loadEquipments()
    }

    // 开始自动刷新
    const handleStartAutoRefresh = () => {
      startAutoRefresh()
    }

    // 搜索设备
    const handleSearch = (keyword) => {
      const results = searchEquipments(keyword)
      console.log('搜索结果:', results)
    }

    return {
      handleLoadEquipments,
      handleStartAutoRefresh,
      handleSearch,
      equipments,
      stats,
      faultEquipments
    }
  }
}
```

#### 4.5 异常处理

完整的异常上报、处理、跟踪流程。

**功能特性：**
- 异常上报
- 异常处理
- 异常跟踪
- 附件管理

**使用示例：**

```typescript
import { useException } from '@/composables/useException'

export default {
  setup() {
    const {
      reportException,
      handleException,
      loadExceptions,
      uploadAttachment,
      reportForm,
      handleForm,
      stats,
      pendingExceptions
    } = useException({
      onReport: async (form) => {
        // 上报异常
        return null
      },
      onHandle: async (form) => {
        // 处理异常
        return true
      }
    })

    // 上报异常
    const handleReport = async () => {
      reportForm.type = 'quality'
      reportForm.description = '产品外观不良'
      const result = await reportException()
      if (result) {
        console.log('异常上报成功')
      }
    }

    // 处理异常
    const handleProcess = async (exceptionId) => {
      handleForm.exceptionId = exceptionId
      handleForm.handleResult = '已处理'
      const success = await handleException()
      if (success) {
        console.log('异常处理成功')
      }
    }

    return {
      handleReport,
      handleProcess,
      reportForm,
      handleForm,
      stats,
      pendingExceptions
    }
  }
}
```

### 5. 页面构建器

支持动态配置页面渲染。

**功能特性：**
- 配置化页面定义
- 动态组件渲染
- 数据绑定
- 事件处理

**使用示例：**

```typescript
import { pageBuilder } from '@/page-builder'

const pageConfig = {
  pageCode: 'demo',
  title: '演示页面',
  layout: { columns: 2, gutter: 16 },
  components: [
    {
      id: 'btn1',
      type: 'MButton',
      props: { text: '按钮1' },
      events: {
        click: { type: 'api', action: 'POST', url: '/api/action' }
      }
    }
  ]
}

const parsed = pageBuilder.parse(pageConfig)
const vnode = pageBuilder.render(parsed)
```

### 6. 状态管理

基于 Pinia 的全局状态管理。

**功能特性：**
- 用户状态管理
- 应用状态管理
- 状态持久化
- 离线支持

**使用示例：**

```typescript
import { useUserStore } from '@/store/modules/user'
import { useAppStore } from '@/store/modules/app'

export default {
  setup() {
    const userStore = useUserStore()
    const appStore = useAppStore()

    // 获取用户信息
    const userInfo = userStore.userInfo

    // 更新应用状态
    appStore.setTheme('dark')

    return { userInfo }
  }
}
```

### 7. 日志系统

完整的日志记录和错误追踪系统。

**功能特性：**
- 多级别日志（debug、info、warn、error）
- 日志本地缓存
- 日志上传
- 全局错误捕获

**使用示例：**

```typescript
import { logService } from '@/services/log'

// 记录日志
logService.debug('调试信息', { data: 'value' })
logService.info('信息', { data: 'value' })
logService.warn('警告', { data: 'value' })
logService.error('错误', new Error('错误信息'), { data: 'value' })

// 获取最近的日志
const logs = logService.getRecentLogs(10)

// 上传日志
await logService.flush()
```

## 📚 API 文档

### HTTP 服务

```typescript
interface HttpService {
  request<T>(config: RequestConfig): Promise<ResponseData<T>>
  get<T>(url: string, params?: Record<string, any>): Promise<ResponseData<T>>
  post<T>(url: string, data?: Record<string, any>): Promise<ResponseData<T>>
  put<T>(url: string, data?: Record<string, any>): Promise<ResponseData<T>>
  delete<T>(url: string, params?: Record<string, any>): Promise<ResponseData<T>>
  cancel(cancelToken: string): void
  cancelAll(): void
}
```

### 权限服务

```typescript
interface AuthService {
  login(username: string, password: string): Promise<UserInfo>
  logout(): Promise<void>
  refreshToken(): Promise<string>
  getUserInfo(): UserInfo | null
  hasPermission(permission: string): boolean
  hasRole(role: string): boolean
  hasPageAccess(pageCode: string): boolean
}
```

### 存储服务

```typescript
interface StorageService {
  get<T>(key: string): T | null
  set<T>(key: string, value: T, expire?: number): void
  remove(key: string): void
  clear(): void
  getSync<T>(key: string): T | null
  setSync<T>(key: string, value: T, expire?: number): void
}
```

## 💡 使用示例

### 完整的登录流程

```vue
<template>
  <view class="login-page">
    <input v-model="username" placeholder="用户名" />
    <input v-model="password" type="password" placeholder="密码" />
    <button @click="handleLogin" :disabled="loading">
      {{ loading ? '登录中...' : '登录' }}
    </button>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { authService } from '@/services/auth'

const username = ref('')
const password = ref('')
const loading = ref(false)

const handleLogin = async () => {
  loading.value = true
  try {
    await authService.login(username.value, password.value)
    uni.reLaunch({ url: '/pages/home/index' })
  } catch (e) {
    uni.showToast({
      title: e instanceof Error ? e.message : '登录失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}
</script>
```

### 扫码并处理业务

```vue
<template>
  <view class="scan-page">
    <button @click="handleScan">开始扫码</button>
    <view v-if="lastScanResult">
      <text>扫码类型: {{ lastScanResult.type }}</text>
      <text>扫码内容: {{ lastScanResult.raw }}</text>
      <text>业务数据: {{ JSON.stringify(lastScanResult.data) }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useScanner } from '@/composables/useScanner'

const { startScan, lastScanResult } = useScanner({
  onSuccess: (result) => {
    console.log('扫码成功:', result)
  },
  onError: (error) => {
    uni.showToast({ title: error, icon: 'none' })
  }
})

const handleScan = async () => {
  await startScan()
}
</script>
```

### 权限控制示例

```vue
<template>
  <view class="page">
    <!-- 只有拥有 user:edit 权限的用户才能看到 -->
    <button v-permission="'user:edit'" @click="handleEdit">编辑</button>

    <!-- 拥有多个权限中的任意一个即可 -->
    <button v-permission="['user:delete', 'admin']" @click="handleDelete">删除</button>

    <!-- 使用 useAuth 组合式函数 -->
    <view v-if="hasPermission('user:view')">
      <text>用户信息</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useAuth } from '@/composables/useAuth'

const { hasPermission } = useAuth()

const handleEdit = () => {
  console.log('编辑用户')
}

const handleDelete = () => {
  console.log('删除用户')
}
</script>
```

## 🧪 测试

### 运行测试

```bash
# 运行所有测试
npm test

# 运行单次测试
npm test -- --run

# 监听模式
npm test -- --watch

# 生成覆盖率报告
npm test -- --coverage
```

### 测试覆盖

框架包含 80+ 个测试用例，覆盖：

- HTTP 服务（请求、重试、令牌管理）
- 权限系统（权限验证、指令）
- 设备适配（设备检测、布局配置）
- 页面构建器（配置解析、组件渲染）
- 存储服务（数据序列化、过期管理）
- 离线同步（队列管理、数据完整性）
- 日志服务（日志记录、错误捕获）

### 属性测试

使用 fast-check 进行属性测试，验证：

1. **HTTP 请求令牌自动注入** - 所有请求都包含有效令牌
2. **响应数据解析一致性** - 响应数据格式始终一致
3. **请求重试次数限制** - 重试次数不超过配置值
4. **权限验证一致性** - 权限检查结果准确
5. **权限指令元素可见性** - 权限指令正确控制元素显示
6. **设备类型识别与布局配置一致性** - 设备检测和配置匹配
7. **页面配置解析完整性** - 配置解析不丢失数据
8. **状态持久化往返一致性** - 序列化/反序列化保持一致
9. **离线队列数据完整性** - 队列数据不丢失
10. **错误日志完整性** - 错误信息完整记录

## 📦 部署

### H5 部署

```bash
# 构建
npm run build:h5

# 输出目录：dist/h5
# 部署到 Web 服务器
```

### 微信小程序部署

```bash
# 构建
npm run build:mp-weixin

# 输出目录：dist/mp-weixin
# 使用微信开发者工具上传
```

### App 部署

```bash
# 构建 Android
npm run build:app-android

# 构建 iOS
npm run build:app-ios

# 使用 HBuilderX 打包
```

## 🔧 配置

### 应用配置

编辑 `src/config/app.config.ts`：

```typescript
export const appConfig = {
  apiBaseUrl: 'https://api.example.com',
  apiTimeout: 30000,
  retryCount: 3,
  retryDelay: 1000,
  logLevel: 'info',
  enableOfflineSync: true
}
```

### 主题配置

编辑 `src/uni.scss` 修改全局样式变量：

```scss
$primary-color: #667eea;
$primary-color-light: #8b9ff5;
$primary-color-dark: #4c5fd5;
```

## 📝 最佳实践

1. **使用组合式函数** - 优先使用 `useXxx` 组合式函数而不是直接调用服务
2. **权限检查** - 在页面和组件中使用权限指令或 `useAuth` 进行权限检查
3. **错误处理** - 使用 try-catch 捕获异步操作的错误
4. **日志记录** - 在关键操作处记录日志便于调试
5. **类型安全** - 充分利用 TypeScript 的类型系统
6. **组件复用** - 使用基础组件库中的组件构建页面
7. **状态管理** - 使用 Pinia store 管理全局状态

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 📞 联系方式

- 文档: [查看设计文档](./kiro/specs/mes-wms-mobile-framework/design.md)
- 需求: [查看需求文档](./kiro/specs/mes-wms-mobile-framework/requirements.md)
- 任务: [查看实现计划](./kiro/specs/mes-wms-mobile-framework/tasks.md)

---

**最后更新**: 2024年12月28日  
**框架版本**: 1.0.0  
**测试覆盖**: 80+ 测试用例，100% 通过
