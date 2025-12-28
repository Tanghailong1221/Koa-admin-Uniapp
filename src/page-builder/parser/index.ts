/**
 * 页面配置解析器
 * 负责解析后台配置的页面JSON，验证配置有效性
 */

import type {
    PageConfig,
    ComponentConfig,
    DataSourceConfig,
    ParsedPage,
    ParsedComponent,
    EventConfig,
} from '@/types'

/** 解析错误 */
export class ParseError extends Error {
    constructor(
        message: string,
        public path: string,
        public details?: Record<string, unknown>
    ) {
        super(message)
        this.name = 'ParseError'
    }
}

/** 验证结果 */
export interface ValidationResult {
    valid: boolean
    errors: ValidationError[]
}

/** 验证错误 */
export interface ValidationError {
    path: string
    message: string
    code: string
}

/** 支持的组件类型 */
export const SUPPORTED_COMPONENT_TYPES = [
    // 基础组件
    'MButton',
    'MInput',
    'MCard',
    'MList',
    'MText',
    'MImage',
    'MIcon',
    // 业务组件
    'MScanner',
    'MTable',
    'MForm',
    'MWorkOrderCard',
    'MLocationPicker',
    // 布局组件
    'MContainer',
    'MRow',
    'MCol',
    'MGrid',
    'MScrollView',
    // 表单组件
    'MSelect',
    'MDatePicker',
    'MSwitch',
    'MRadio',
    'MCheckbox',
] as const

/** 组件类型集合 */
const componentTypeSet = new Set(SUPPORTED_COMPONENT_TYPES)

/**
 * 验证页面配置
 */
export const validatePageConfig = (config: unknown): ValidationResult => {
    const errors: ValidationError[] = []

    if (!config || typeof config !== 'object') {
        errors.push({
            path: '',
            message: '配置必须是一个对象',
            code: 'INVALID_CONFIG',
        })
        return { valid: false, errors }
    }

    const pageConfig = config as Record<string, unknown>

    // 验证必填字段
    if (!pageConfig.pageCode || typeof pageConfig.pageCode !== 'string') {
        errors.push({
            path: 'pageCode',
            message: '页面编码是必填的字符串',
            code: 'REQUIRED_FIELD',
        })
    }

    if (!pageConfig.title || typeof pageConfig.title !== 'string') {
        errors.push({
            path: 'title',
            message: '页面标题是必填的字符串',
            code: 'REQUIRED_FIELD',
        })
    }

    if (!Array.isArray(pageConfig.components)) {
        errors.push({
            path: 'components',
            message: '组件列表必须是数组',
            code: 'INVALID_TYPE',
        })
    } else {
        // 验证每个组件
        pageConfig.components.forEach((comp, index) => {
            const compErrors = validateComponentConfig(comp, `components[${index}]`)
            errors.push(...compErrors)
        })
    }

    // 验证数据源配置
    if (pageConfig.dataSource !== undefined) {
        if (!Array.isArray(pageConfig.dataSource)) {
            errors.push({
                path: 'dataSource',
                message: '数据源配置必须是数组',
                code: 'INVALID_TYPE',
            })
        } else {
            pageConfig.dataSource.forEach((ds, index) => {
                const dsErrors = validateDataSourceConfig(ds, `dataSource[${index}]`)
                errors.push(...dsErrors)
            })
        }
    }

    return { valid: errors.length === 0, errors }
}

/**
 * 验证组件配置
 */
export const validateComponentConfig = (
    config: unknown,
    path: string
): ValidationError[] => {
    const errors: ValidationError[] = []

    if (!config || typeof config !== 'object') {
        errors.push({
            path,
            message: '组件配置必须是对象',
            code: 'INVALID_CONFIG',
        })
        return errors
    }

    const comp = config as Record<string, unknown>

    // 验证ID
    if (!comp.id || typeof comp.id !== 'string') {
        errors.push({
            path: `${path}.id`,
            message: '组件ID是必填的字符串',
            code: 'REQUIRED_FIELD',
        })
    }

    // 验证类型
    if (!comp.type || typeof comp.type !== 'string') {
        errors.push({
            path: `${path}.type`,
            message: '组件类型是必填的字符串',
            code: 'REQUIRED_FIELD',
        })
    } else if (!componentTypeSet.has(comp.type as typeof SUPPORTED_COMPONENT_TYPES[number])) {
        errors.push({
            path: `${path}.type`,
            message: `不支持的组件类型: ${comp.type}`,
            code: 'UNSUPPORTED_TYPE',
        })
    }

    // 验证props
    if (comp.props !== undefined && typeof comp.props !== 'object') {
        errors.push({
            path: `${path}.props`,
            message: '组件属性必须是对象',
            code: 'INVALID_TYPE',
        })
    }

    // 验证子组件
    if (comp.children !== undefined) {
        if (!Array.isArray(comp.children)) {
            errors.push({
                path: `${path}.children`,
                message: '子组件必须是数组',
                code: 'INVALID_TYPE',
            })
        } else {
            comp.children.forEach((child, index) => {
                const childErrors = validateComponentConfig(
                    child,
                    `${path}.children[${index}]`
                )
                errors.push(...childErrors)
            })
        }
    }

    return errors
}

/**
 * 验证数据源配置
 */
export const validateDataSourceConfig = (
    config: unknown,
    path: string
): ValidationError[] => {
    const errors: ValidationError[] = []

    if (!config || typeof config !== 'object') {
        errors.push({
            path,
            message: '数据源配置必须是对象',
            code: 'INVALID_CONFIG',
        })
        return errors
    }

    const ds = config as Record<string, unknown>

    // 验证ID
    if (!ds.id || typeof ds.id !== 'string') {
        errors.push({
            path: `${path}.id`,
            message: '数据源ID是必填的字符串',
            code: 'REQUIRED_FIELD',
        })
    }

    // 验证类型
    const validTypes = ['api', 'static', 'computed']
    if (!ds.type || !validTypes.includes(ds.type as string)) {
        errors.push({
            path: `${path}.type`,
            message: `数据源类型必须是: ${validTypes.join(', ')}`,
            code: 'INVALID_TYPE',
        })
    }

    // 验证配置
    if (!ds.config || typeof ds.config !== 'object') {
        errors.push({
            path: `${path}.config`,
            message: '数据源配置详情是必填的',
            code: 'REQUIRED_FIELD',
        })
    }

    return errors
}

/**
 * 解析组件配置
 */
const parseComponent = (
    config: ComponentConfig,
    permissions: Set<string>
): ParsedComponent => {
    // 检查权限
    let visible = config.visible !== false
    if (config.permission && !permissions.has(config.permission)) {
        visible = false
    }

    // 解析子组件
    const children = config.children?.map((child) => parseComponent(child, permissions))

    return {
        id: config.id,
        type: config.type,
        props: { ...config.props },
        children,
        visible,
    }
}

/**
 * 解析页面配置
 */
export const parsePageConfig = (
    config: PageConfig,
    userPermissions: string[] = []
): ParsedPage => {
    // 验证配置
    const validation = validatePageConfig(config)
    if (!validation.valid) {
        throw new ParseError(
            '页面配置验证失败',
            '',
            { errors: validation.errors }
        )
    }

    const permissions = new Set(userPermissions)

    // 解析组件
    const components = config.components.map((comp) => parseComponent(comp, permissions))

    // 初始化数据源映射
    const dataSources = new Map<string, unknown>()
    if (config.dataSource) {
        config.dataSource.forEach((ds) => {
            if (ds.type === 'static' && 'data' in ds.config) {
                dataSources.set(ds.id, (ds.config as { data: unknown }).data)
            } else {
                dataSources.set(ds.id, null)
            }
        })
    }

    return {
        pageCode: config.pageCode,
        title: config.title,
        components,
        dataSources,
    }
}

/**
 * 检查组件类型是否支持
 */
export const isComponentTypeSupported = (type: string): boolean => {
    return componentTypeSet.has(type as typeof SUPPORTED_COMPONENT_TYPES[number])
}

/**
 * 获取组件的数据绑定字段
 */
export const getDataBindings = (config: PageConfig): Map<string, string[]> => {
    const bindings = new Map<string, string[]>()

    const collectBindings = (components: ComponentConfig[]) => {
        components.forEach((comp) => {
            if (comp.dataBinding) {
                const source = comp.dataBinding.source
                if (!bindings.has(source)) {
                    bindings.set(source, [])
                }
                bindings.get(source)!.push(comp.dataBinding.field)
            }
            if (comp.children) {
                collectBindings(comp.children)
            }
        })
    }

    collectBindings(config.components)
    return bindings
}

/**
 * 获取页面所有事件配置
 */
export const getEventConfigs = (config: PageConfig): EventConfig[] => {
    const events: EventConfig[] = []

    // 页面级事件
    if (config.events) {
        events.push(...config.events)
    }

    // 组件级事件
    const collectEvents = (components: ComponentConfig[]) => {
        components.forEach((comp) => {
            if (comp.events) {
                Object.values(comp.events).forEach((event) => {
                    events.push(event)
                })
            }
            if (comp.children) {
                collectEvents(comp.children)
            }
        })
    }

    collectEvents(config.components)
    return events
}

/**
 * 深度克隆配置
 */
export const cloneConfig = <T>(config: T): T => {
    return JSON.parse(JSON.stringify(config))
}

export default {
    validatePageConfig,
    validateComponentConfig,
    validateDataSourceConfig,
    parsePageConfig,
    isComponentTypeSupported,
    getDataBindings,
    getEventConfigs,
    cloneConfig,
    SUPPORTED_COMPONENT_TYPES,
}
