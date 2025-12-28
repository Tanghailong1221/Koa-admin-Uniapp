/**
 * 页面构建器相关类型定义
 */

/** 页面配置 */
export interface PageConfig {
    /** 页面编码 */
    pageCode: string
    /** 页面标题 */
    title: string
    /** 所需权限 */
    permission?: string
    /** 布局配置 */
    layout?: PageLayoutConfig
    /** 组件列表 */
    components: ComponentConfig[]
    /** 数据源配置 */
    dataSource?: DataSourceConfig[]
    /** 事件配置 */
    events?: EventConfig[]
}

/** 页面布局配置 */
export interface PageLayoutConfig {
    /** 布局类型 */
    type: 'flex' | 'grid'
    /** 方向 */
    direction?: 'row' | 'column'
    /** 对齐方式 */
    justify?: 'start' | 'center' | 'end' | 'between' | 'around'
    /** 交叉轴对齐 */
    align?: 'start' | 'center' | 'end' | 'stretch'
    /** 间距 */
    gap?: number
    /** 内边距 */
    padding?: number | string
}

/** 组件配置 */
export interface ComponentConfig {
    /** 组件ID */
    id: string
    /** 组件类型 */
    type: string
    /** 组件属性 */
    props: Record<string, unknown>
    /** 子组件 */
    children?: ComponentConfig[]
    /** 数据绑定 */
    dataBinding?: DataBindingConfig
    /** 所需权限 */
    permission?: string
    /** 是否可见 */
    visible?: boolean | string
    /** 事件绑定 */
    events?: Record<string, EventConfig>
    /** 样式 */
    style?: Record<string, string | number>
    /** 类名 */
    class?: string | string[]
}

/** 数据源配置 */
export interface DataSourceConfig {
    /** 数据源ID */
    id: string
    /** 数据源类型 */
    type: DataSourceType
    /** 配置详情 */
    config: ApiDataSourceConfig | StaticDataSourceConfig | ComputedDataSourceConfig
    /** 是否自动加载 */
    autoLoad?: boolean
    /** 依赖的数据源 */
    dependsOn?: string[]
}

/** 数据源类型 */
export type DataSourceType = 'api' | 'static' | 'computed'

/** API数据源配置 */
export interface ApiDataSourceConfig {
    /** 请求URL */
    url: string
    /** 请求方法 */
    method: 'GET' | 'POST'
    /** 请求参数 */
    params?: Record<string, unknown>
    /** 数据转换 */
    transform?: string
    /** 轮询间隔（毫秒） */
    pollingInterval?: number
}

/** 静态数据源配置 */
export interface StaticDataSourceConfig {
    /** 静态数据 */
    data: unknown
}

/** 计算数据源配置 */
export interface ComputedDataSourceConfig {
    /** 计算表达式 */
    expression: string
    /** 依赖的数据源 */
    dependencies: string[]
}

/** 数据绑定配置 */
export interface DataBindingConfig {
    /** 数据源ID */
    source: string
    /** 字段路径 */
    field: string
    /** 数据转换 */
    transform?: string
    /** 双向绑定 */
    twoWay?: boolean
}

/** 事件配置 */
export interface EventConfig {
    /** 事件类型 */
    type: string
    /** 动作类型 */
    action: EventActionType
    /** 动作配置 */
    config: ApiActionConfig | NavigateActionConfig | ScriptActionConfig | EmitActionConfig
}

/** 事件动作类型 */
export type EventActionType = 'api' | 'navigate' | 'script' | 'emit'

/** API动作配置 */
export interface ApiActionConfig {
    /** 请求URL */
    url: string
    /** 请求方法 */
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
    /** 请求参数 */
    params?: Record<string, unknown>
    /** 成功回调 */
    onSuccess?: EventConfig
    /** 失败回调 */
    onError?: EventConfig
}

/** 导航动作配置 */
export interface NavigateActionConfig {
    /** 目标页面 */
    url: string
    /** 导航类型 */
    type?: 'navigateTo' | 'redirectTo' | 'reLaunch' | 'switchTab' | 'navigateBack'
    /** 页面参数 */
    params?: Record<string, unknown>
}

/** 脚本动作配置 */
export interface ScriptActionConfig {
    /** 脚本内容 */
    script: string
}

/** 事件发射配置 */
export interface EmitActionConfig {
    /** 事件名称 */
    eventName: string
    /** 事件数据 */
    data?: Record<string, unknown>
}

/** 动态页面配置（带元数据） */
export interface DynamicPageConfig {
    /** 配置ID */
    id: string
    /** 页面编码 */
    code: string
    /** 页面名称 */
    name: string
    /** 版本号 */
    version: number
    /** 页面配置 */
    config: PageConfig
    /** 所需权限 */
    permission?: string
    /** 状态 */
    status: 'draft' | 'published'
    /** 创建时间 */
    createdAt: string
    /** 更新时间 */
    updatedAt: string
}

/** 解析后的页面 */
export interface ParsedPage {
    /** 页面编码 */
    pageCode: string
    /** 页面标题 */
    title: string
    /** 组件列表 */
    components: ParsedComponent[]
    /** 数据源映射 */
    dataSources: Map<string, unknown>
}

/** 解析后的组件 */
export interface ParsedComponent {
    /** 组件ID */
    id: string
    /** 组件类型 */
    type: string
    /** 组件属性 */
    props: Record<string, unknown>
    /** 子组件 */
    children?: ParsedComponent[]
    /** 是否可见 */
    visible: boolean
}
