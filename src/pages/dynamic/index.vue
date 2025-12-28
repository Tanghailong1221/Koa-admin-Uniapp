<template>
    <view class="dynamic-page">
        <!-- 加载状态 -->
        <view v-if="loading" class="dynamic-page__loading">
            <view class="dynamic-page__loading-icon"></view>
            <text class="dynamic-page__loading-text">页面加载中...</text>
        </view>

        <!-- 错误状态 -->
        <view v-else-if="error" class="dynamic-page__error">
            <text class="dynamic-page__error-icon">!</text>
            <text class="dynamic-page__error-text">{{ error.message }}</text>
            <view class="dynamic-page__error-btn" @click="reload">
                <text>重新加载</text>
            </view>
        </view>

        <!-- 无权限状态 -->
        <view v-else-if="!hasPermission" class="dynamic-page__forbidden">
            <text class="dynamic-page__forbidden-icon">🔒</text>
            <text class="dynamic-page__forbidden-text">您没有访问此页面的权限</text>
            <view class="dynamic-page__forbidden-btn" @click="goBack">
                <text>返回上一页</text>
            </view>
        </view>

        <!-- 页面内容 -->
        <view v-else-if="parsedPage" class="dynamic-page__content">
            <!-- 页面标题 -->
            <view v-if="showTitle && parsedPage.title" class="dynamic-page__header">
                <text class="dynamic-page__title">{{ parsedPage.title }}</text>
            </view>

            <!-- 动态渲染的组件 -->
            <view class="dynamic-page__body">
                <component
                    v-for="comp in renderedComponents"
                    :key="comp.id"
                    :is="getComponentByType(comp.type)"
                    v-bind="comp.props"
                    @event="handleComponentEvent(comp.id, $event)"
                />
            </view>
        </view>

        <!-- 空状态 -->
        <view v-else class="dynamic-page__empty">
            <text>页面配置为空</text>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, type Component } from 'vue'
import { parsePageConfig } from '@/page-builder/parser'
import {
    registerComponent,
    registerComponents,
    getComponent,
    createDataContext,
    type DataContext,
} from '@/page-builder/renderer'
import type { PageConfig, ParsedPage, ParsedComponent, DataSourceConfig } from '@/types'
import { useAuth } from '@/composables/useAuth'

// 基础组件
import MButton from '@/components/base/MButton.vue'
import MInput from '@/components/base/MInput.vue'
import MCard from '@/components/base/MCard.vue'
import MList from '@/components/base/MList.vue'

// 业务组件
import MScanner from '@/components/business/MScanner.vue'
import MTable from '@/components/business/MTable.vue'
import MForm from '@/components/business/MForm.vue'

// Props定义
export interface DynamicPageProps {
    /** 页面编码，用于从API加载配置 */
    pageCode?: string
    /** 直接传入的页面配置 */
    config?: PageConfig
    /** 是否显示标题 */
    showTitle?: boolean
    /** 页面参数 */
    params?: Record<string, unknown>
}

const props = withDefaults(defineProps<DynamicPageProps>(), {
    pageCode: '',
    config: undefined,
    showTitle: true,
    params: () => ({}),
})

const emit = defineEmits<{
    (e: 'loaded', page: ParsedPage): void
    (e: 'error', error: Error): void
    (e: 'event', componentId: string, eventData: unknown): void
}>()

// 注册组件
const initComponents = () => {
    registerComponents({
        MButton,
        MInput,
        MCard,
        MList,
        MScanner,
        MTable,
        MForm,
    })
}

// 状态
const loading = ref(false)
const error = ref<Error | null>(null)
const pageConfig = ref<PageConfig | null>(null)
const parsedPage = ref<ParsedPage | null>(null)
const dataSources = ref<Map<string, unknown>>(new Map())
const formData = ref<Record<string, unknown>>({})

// 权限
const { hasPermission: checkPermission, permissions } = useAuth()

// 检查页面权限
const hasPermission = computed(() => {
    if (!pageConfig.value?.permission) {
        return true
    }
    return checkPermission(pageConfig.value.permission)
})

// 数据上下文
const dataContext = computed<DataContext>(() =>
    createDataContext(dataSources.value, formData.value, props.params)
)

// 渲染的组件列表
const renderedComponents = computed(() => {
    if (!parsedPage.value) return []
    return parsedPage.value.components.filter((comp) => comp.visible)
})

// 根据类型获取组件
const getComponentByType = (type: string): Component | string => {
    const component = getComponent(type)
    if (component) {
        return component
    }
    // 返回一个占位组件
    return 'view'
}

// 加载页面配置
const loadPageConfig = async () => {
    // 如果直接传入了配置，使用传入的配置
    if (props.config) {
        pageConfig.value = props.config
        return
    }

    // 否则从API加载
    if (!props.pageCode) {
        throw new Error('页面编码不能为空')
    }

    // 模拟API调用
    const result = await new Promise<PageConfig>((resolve, reject) => {
        uni.request({
            url: `/api/pages/${props.pageCode}`,
            method: 'GET',
            success: (res) => {
                if (res.statusCode === 200 && res.data) {
                    resolve(res.data as PageConfig)
                } else {
                    reject(new Error('加载页面配置失败'))
                }
            },
            fail: (err) => {
                reject(new Error(err.errMsg || '网络请求失败'))
            },
        })
    })

    pageConfig.value = result
}

// 解析页面配置
const parseConfig = () => {
    if (!pageConfig.value) {
        throw new Error('页面配置为空')
    }

    parsedPage.value = parsePageConfig(pageConfig.value, permissions.value)

    // 初始化数据源
    if (parsedPage.value.dataSources) {
        dataSources.value = new Map(parsedPage.value.dataSources)
    }
}

// 加载数据源
const loadDataSources = async () => {
    if (!pageConfig.value?.dataSource) return

    const autoLoadSources = pageConfig.value.dataSource.filter((ds) => ds.autoLoad !== false)

    await Promise.all(
        autoLoadSources.map(async (ds) => {
            try {
                const data = await loadDataSource(ds)
                dataSources.value.set(ds.id, data)
            } catch (e) {
                console.error(`加载数据源 ${ds.id} 失败:`, e)
            }
        })
    )
}

// 加载单个数据源
const loadDataSource = async (config: DataSourceConfig): Promise<unknown> => {
    switch (config.type) {
        case 'static':
            return (config.config as { data: unknown }).data

        case 'api': {
            const apiConfig = config.config as {
                url: string
                method: string
                params?: Record<string, unknown>
            }
            return new Promise((resolve, reject) => {
                uni.request({
                    url: apiConfig.url,
                    method: apiConfig.method as 'GET' | 'POST',
                    data: apiConfig.params,
                    success: (res) => resolve(res.data),
                    fail: (err) => reject(err),
                })
            })
        }

        case 'computed':
            // 计算型数据源，暂不实现
            return null

        default:
            return null
    }
}

// 初始化页面
const initPage = async () => {
    loading.value = true
    error.value = null

    try {
        // 初始化组件
        initComponents()

        // 加载配置
        await loadPageConfig()

        // 解析配置
        parseConfig()

        // 加载数据源
        await loadDataSources()

        // 触发加载完成事件
        if (parsedPage.value) {
            emit('loaded', parsedPage.value)
        }
    } catch (e) {
        error.value = e instanceof Error ? e : new Error(String(e))
        emit('error', error.value)
    } finally {
        loading.value = false
    }
}

// 重新加载
const reload = () => {
    initPage()
}

// 返回上一页
const goBack = () => {
    uni.navigateBack()
}

// 处理组件事件
const handleComponentEvent = (componentId: string, eventData: unknown) => {
    emit('event', componentId, eventData)
}

// 刷新数据源
const refreshDataSource = async (sourceId: string) => {
    const config = pageConfig.value?.dataSource?.find((ds) => ds.id === sourceId)
    if (config) {
        const data = await loadDataSource(config)
        dataSources.value.set(sourceId, data)
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

// 监听配置变化
watch(
    () => props.config,
    () => {
        if (props.config) {
            initPage()
        }
    }
)

// 监听页面编码变化
watch(
    () => props.pageCode,
    () => {
        if (props.pageCode) {
            initPage()
        }
    }
)

// 页面加载时初始化
onMounted(() => {
    // 获取页面参数
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const options = (currentPage as { options?: Record<string, string> })?.options || {}

    // 如果URL中有pageCode参数，使用URL参数
    if (options.pageCode && !props.pageCode && !props.config) {
        // 通过URL参数加载
        initPage()
    } else if (props.pageCode || props.config) {
        initPage()
    }
})

// 暴露方法
defineExpose({
    reload,
    refreshDataSource,
    updateFormData,
    getFormData,
    resetForm,
    dataContext,
    parsedPage,
})
</script>

<style lang="scss" scoped>
.dynamic-page {
    min-height: 100vh;
    background-color: #f5f7fa;

    &__loading,
    &__error,
    &__forbidden,
    &__empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 40rpx;
    }

    &__loading {
        &-icon {
            width: 80rpx;
            height: 80rpx;
            border: 6rpx solid #409eff;
            border-top-color: transparent;
            border-radius: 50%;
            animation: loading-spin 0.8s linear infinite;
        }

        &-text {
            margin-top: 24rpx;
            font-size: 28rpx;
            color: #909399;
        }
    }

    &__error {
        &-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100rpx;
            height: 100rpx;
            background-color: #f56c6c;
            border-radius: 50%;
            font-size: 48rpx;
            color: #fff;
            font-weight: bold;
        }

        &-text {
            margin-top: 24rpx;
            font-size: 28rpx;
            color: #606266;
            text-align: center;
        }

        &-btn {
            margin-top: 32rpx;
            padding: 16rpx 48rpx;
            background-color: #409eff;
            border-radius: 8rpx;
            color: #fff;
            font-size: 28rpx;

            &:active {
                background-color: #3a8ee6;
            }
        }
    }

    &__forbidden {
        &-icon {
            font-size: 80rpx;
        }

        &-text {
            margin-top: 24rpx;
            font-size: 28rpx;
            color: #606266;
        }

        &-btn {
            margin-top: 32rpx;
            padding: 16rpx 48rpx;
            background-color: #909399;
            border-radius: 8rpx;
            color: #fff;
            font-size: 28rpx;

            &:active {
                background-color: #82848a;
            }
        }
    }

    &__content {
        min-height: 100vh;
    }

    &__header {
        padding: 24rpx 32rpx;
        background-color: #fff;
        border-bottom: 1px solid #ebeef5;
    }

    &__title {
        font-size: 36rpx;
        font-weight: 500;
        color: #303133;
    }

    &__body {
        padding: 24rpx;
    }

    &__empty {
        font-size: 28rpx;
        color: #909399;
    }
}

@keyframes loading-spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}
</style>
