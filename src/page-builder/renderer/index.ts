/**
 * 页面组件渲染器
 * 负责将解析后的配置渲染为Vue组件
 */

import { h, defineComponent, ref, computed, watch, type VNode, type Component } from 'vue'
import type {
    ParsedComponent,
    ParsedPage,
    DataSourceConfig,
    EventConfig,
    ApiActionConfig,
    NavigateActionConfig,
} from '@/types'

/** 组件注册表 */
const componentRegistry = new Map<string, Component>()

/** 数据上下文 */
export interface DataContext {
    /** 数据源数据 */
    dataSources: Map<string, unknown>
    /** 表单数据 */
    formData: Record<string, unknown>
    /** 页面参数 */
    params: Record<string, unknown>
}

/** 事件处理器 */
export type EventHandler = (event: unknown, context: DataContext) => void | Promise<void>

/** 渲染选项 */
export interface RenderOptions {
    /** 数据上下文 */
    context: DataContext
    /** 事件处理器映射 */
    eventHandlers?: Map<string, EventHandler>
    /** 自定义组件映射 */
    customComponents?: Map<string, Component>
}

/**
 * 注册组件
 */
export const registerComponent = (name: string, component: Component): void => {
    componentRegistry.set(name, component)
}

/**
 * 批量注册组件
 */
export const registerComponents = (components: Record<string, Component>): void => {
    Object.entries(components).forEach(([name, component]) => {
        componentRegistry.set(name, component)
    })
}

/**
 * 获取已注册组件
 */
export const getComponent = (name: string): Component | undefined => {
    return componentRegistry.get(name)
}

/**
 * 检查组件是否已注册
 */
export const hasComponent = (name: string): boolean => {
    return componentRegistry.has(name)
}

/**
 * 解析数据绑定表达式
 */
export const resolveBinding = (
    expression: string,
    context: DataContext
): unknown => {
    // 简单的点号路径解析
    const parts = expression.split('.')
    let value: unknown = context

    for (const part of parts) {
        if (value === null || value === undefined) {
            return undefined
        }
        if (typeof value === 'object') {
            if (part === 'dataSources' && value === context) {
                value = Object.fromEntries(context.dataSources)
            } else {
                value = (value as Record<string, unknown>)[part]
            }
        } else {
            return undefined
        }
    }

    return value
}

/**
 * 创建事件处理函数
 */
export const createEventHandler = (
    config: EventConfig,
    context: DataContext
): EventHandler => {
    return async (event: unknown) => {
        switch (config.action) {
            case 'api': {
                const apiConfig = config.config as ApiActionConfig
                try {
                    await new Promise<void>((resolve, reject) => {
                        uni.request({
                            url: apiConfig.url,
                            method: apiConfig.method,
                            data: apiConfig.params,
                            success: () => resolve(),
                            fail: (err) => reject(err),
                        })
                    })
                    if (apiConfig.onSuccess) {
                        const successHandler = createEventHandler(apiConfig.onSuccess, context)
                        await successHandler(event, context)
                    }
                } catch (error) {
                    if (apiConfig.onError) {
                        const errorHandler = createEventHandler(apiConfig.onError, context)
                        await errorHandler(error, context)
                    }
                }
                break
            }
            case 'navigate': {
                const navConfig = config.config as NavigateActionConfig
                const url = navConfig.params
                    ? `${navConfig.url}?${new URLSearchParams(
                        Object.entries(navConfig.params).map(([k, v]) => [k, String(v)])
                    ).toString()}`
                    : navConfig.url

                switch (navConfig.type || 'navigateTo') {
                    case 'navigateTo':
                        uni.navigateTo({ url })
                        break
                    case 'redirectTo':
                        uni.redirectTo({ url })
                        break
                    case 'reLaunch':
                        uni.reLaunch({ url })
                        break
                    case 'switchTab':
                        uni.switchTab({ url })
                        break
                    case 'navigateBack':
                        uni.navigateBack()
                        break
                }
                break
            }
            case 'script': {
                // 脚本执行（安全考虑，生产环境应禁用）
                console.warn('Script action is not recommended for production')
                break
            }
            case 'emit': {
                // 事件发射由父组件处理
                break
            }
        }
    }
}

/**
 * 渲染单个组件
 */
export const renderComponent = (
    config: ParsedComponent,
    options: RenderOptions
): VNode | null => {
    // 检查可见性
    if (!config.visible) {
        return null
    }

    // 获取组件
    const component = options.customComponents?.get(config.type) || componentRegistry.get(config.type)

    if (!component) {
        console.warn(`Component not found: ${config.type}`)
        // 返回占位符
        return h('div', { class: 'component-not-found' }, `[${config.type}]`)
    }

    // 处理属性
    const props = { ...config.props }

    // 渲染子组件
    const children = config.children?.map((child) => renderComponent(child, options)).filter(Boolean)

    // 创建VNode
    return h(component, props, children?.length ? () => children : undefined)
}

/**
 * 渲染页面
 */
export const renderPage = (
    page: ParsedPage,
    options: RenderOptions
): VNode[] => {
    return page.components
        .map((comp) => renderComponent(comp, options))
        .filter((vnode): vnode is VNode => vnode !== null)
}

/**
 * 创建动态页面组件
 */
export const createDynamicPage = (page: ParsedPage) => {
    return defineComponent({
        name: `DynamicPage_${page.pageCode}`,
        setup() {
            // 数据源状态
            const dataSources = ref(new Map(page.dataSources))
            const formData = ref<Record<string, unknown>>({})
            const params = ref<Record<string, unknown>>({})
            const loading = ref(false)
            const error = ref<Error | null>(null)

            // 数据上下文
            const context = computed<DataContext>(() => ({
                dataSources: dataSources.value,
                formData: formData.value,
                params: params.value,
            }))

            // 渲染选项
            const renderOptions = computed<RenderOptions>(() => ({
                context: context.value,
            }))

            // 加载数据源
            const loadDataSource = async (config: DataSourceConfig) => {
                if (config.type === 'api' && 'url' in config.config) {
                    const apiConfig = config.config as { url: string; method: string; params?: Record<string, unknown> }
                    try {
                        const result = await new Promise<unknown>((resolve, reject) => {
                            uni.request({
                                url: apiConfig.url,
                                method: apiConfig.method as 'GET' | 'POST',
                                data: apiConfig.params,
                                success: (res) => resolve(res.data),
                                fail: (err) => reject(err),
                            })
                        })
                        dataSources.value.set(config.id, result)
                    } catch (e) {
                        console.error(`Failed to load data source: ${config.id}`, e)
                    }
                }
            }

            // 刷新数据
            const refresh = async () => {
                loading.value = true
                error.value = null
                try {
                    // 这里可以添加数据源刷新逻辑
                } catch (e) {
                    error.value = e instanceof Error ? e : new Error(String(e))
                } finally {
                    loading.value = false
                }
            }

            // 更新表单数据
            const updateFormData = (key: string, value: unknown) => {
                formData.value[key] = value
            }

            // 获取表单数据
            const getFormData = () => ({ ...formData.value })

            // 重置表单
            const resetForm = () => {
                formData.value = {}
            }

            return {
                page,
                dataSources,
                formData,
                params,
                loading,
                error,
                context,
                renderOptions,
                loadDataSource,
                refresh,
                updateFormData,
                getFormData,
                resetForm,
            }
        },
        render() {
            return h(
                'div',
                { class: 'dynamic-page' },
                renderPage(this.page, this.renderOptions)
            )
        },
    })
}

/**
 * 创建数据上下文
 */
export const createDataContext = (
    dataSources?: Map<string, unknown>,
    formData?: Record<string, unknown>,
    params?: Record<string, unknown>
): DataContext => {
    return {
        dataSources: dataSources || new Map(),
        formData: formData || {},
        params: params || {},
    }
}

/**
 * 清除组件注册表
 */
export const clearRegistry = (): void => {
    componentRegistry.clear()
}

/**
 * 获取所有已注册组件名称
 */
export const getRegisteredComponents = (): string[] => {
    return Array.from(componentRegistry.keys())
}

export default {
    registerComponent,
    registerComponents,
    getComponent,
    hasComponent,
    resolveBinding,
    createEventHandler,
    renderComponent,
    renderPage,
    createDynamicPage,
    createDataContext,
    clearRegistry,
    getRegisteredComponents,
}
