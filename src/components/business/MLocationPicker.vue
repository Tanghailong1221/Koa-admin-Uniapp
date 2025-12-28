<template>
    <view class="m-location-picker">
        <!-- 搜索框 -->
        <view class="m-location-picker__search">
            <input
                class="m-location-picker__search-input"
                :value="searchKeyword"
                placeholder="搜索库位编码或名称"
                @input="handleSearchInput"
                @confirm="handleSearch"
            />
            <view v-if="searchKeyword" class="m-location-picker__search-clear" @click="clearSearch">
                <text class="m-icon-close"></text>
            </view>
            <view class="m-location-picker__search-btn" @click="handleSearch">
                <text class="m-icon-search"></text>
            </view>
        </view>

        <!-- 面包屑导航 -->
        <view v-if="breadcrumbs.length > 0" class="m-location-picker__breadcrumb">
            <view class="m-location-picker__breadcrumb-item" @click="goToRoot">
                <text>全部</text>
            </view>
            <view v-for="(item, index) in breadcrumbs" :key="item.code" class="m-location-picker__breadcrumb-item" @click="goToBreadcrumb(index)">
                <text class="m-location-picker__breadcrumb-separator">/</text>
                <text>{{ item.name }}</text>
            </view>
        </view>

        <!-- 库位列表 -->
        <scroll-view class="m-location-picker__list" :scroll-y="true" @scrolltolower="handleLoadMore">
            <view v-if="loading && !displayList.length" class="m-location-picker__loading">
                <view class="m-location-picker__loading-icon"></view>
                <text>加载中...</text>
            </view>
            <view v-else-if="!displayList.length" class="m-location-picker__empty">
                <text>{{ searchKeyword ? '未找到匹配的库位' : '暂无库位数据' }}</text>
            </view>
            <view v-else>
                <view
                    v-for="item in displayList"
                    :key="item.code"
                    class="m-location-picker__item"
                    :class="{
                        'm-location-picker__item--selected': isSelected(item),
                        'm-location-picker__item--disabled': item.disabled,
                    }"
                    @click="handleItemClick(item)"
                >
                    <view class="m-location-picker__item-icon">
                        <text :class="item.children?.length ? 'm-icon-folder' : 'm-icon-location'"></text>
                    </view>
                    <view class="m-location-picker__item-content">
                        <view class="m-location-picker__item-name">{{ item.name }}</view>
                        <view class="m-location-picker__item-code">{{ item.code }}</view>
                    </view>
                    <view v-if="item.children?.length" class="m-location-picker__item-arrow" @click.stop="expandItem(item)">
                        <text class="m-icon-arrow-right"></text>
                    </view>
                    <view v-else-if="selectable && !item.disabled" class="m-location-picker__item-check">
                        <view class="m-location-picker__checkbox" :class="{ 'm-location-picker__checkbox--checked': isSelected(item) }"></view>
                    </view>
                </view>
            </view>
            <view v-if="loading && displayList.length" class="m-location-picker__loading-more">
                <view class="m-location-picker__loading-icon"></view>
                <text>加载中...</text>
            </view>
        </scroll-view>

        <!-- 已选择的库位 -->
        <view v-if="multiple && selectedItems.length > 0" class="m-location-picker__selected">
            <view class="m-location-picker__selected-header">
                <text>已选择 {{ selectedItems.length }} 个库位</text>
                <text class="m-location-picker__selected-clear" @click="clearSelection">清空</text>
            </view>
            <scroll-view class="m-location-picker__selected-list" :scroll-x="true">
                <view v-for="item in selectedItems" :key="item.code" class="m-location-picker__selected-item">
                    <text>{{ item.name }}</text>
                    <view class="m-location-picker__selected-remove" @click="removeSelected(item)">
                        <text class="m-icon-close"></text>
                    </view>
                </view>
            </scroll-view>
        </view>

        <!-- 底部操作 -->
        <view v-if="showFooter" class="m-location-picker__footer">
            <view class="m-location-picker__footer-btn" @click="handleCancel">
                <text>取消</text>
            </view>
            <view class="m-location-picker__footer-btn m-location-picker__footer-btn--primary" @click="handleConfirm">
                <text>确定</text>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

export interface LocationItem {
    /** 库位编码 */
    code: string
    /** 库位名称 */
    name: string
    /** 父级编码 */
    parentCode?: string
    /** 子级库位 */
    children?: LocationItem[]
    /** 是否禁用 */
    disabled?: boolean
    /** 扩展数据 */
    [key: string]: unknown
}

export interface MLocationPickerProps {
    /** 库位数据 */
    data?: LocationItem[]
    /** 已选中的值 */
    modelValue?: string | string[]
    /** 是否多选 */
    multiple?: boolean
    /** 是否可选择（false时只能展开查看） */
    selectable?: boolean
    /** 是否显示底部操作栏 */
    showFooter?: boolean
    /** 最大选择数量 */
    maxCount?: number
    /** 是否懒加载 */
    lazy?: boolean
    /** 加载子节点的方法 */
    loadChildren?: (item: LocationItem) => Promise<LocationItem[]>
}

const props = withDefaults(defineProps<MLocationPickerProps>(), {
    data: () => [],
    modelValue: '',
    multiple: false,
    selectable: true,
    showFooter: true,
    maxCount: 0,
    lazy: false,
    loadChildren: undefined,
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: string | string[]): void
    (e: 'change', items: LocationItem[]): void
    (e: 'confirm', items: LocationItem[]): void
    (e: 'cancel'): void
    (e: 'expand', item: LocationItem): void
}>()

// 状态
const searchKeyword = ref('')
const loading = ref(false)
const currentParent = ref<LocationItem | null>(null)
const breadcrumbs = ref<LocationItem[]>([])
const selectedCodes = ref<Set<string>>(new Set())
const expandedData = ref<Map<string, LocationItem[]>>(new Map())

// 初始化选中状态
const initSelection = () => {
    if (props.multiple && Array.isArray(props.modelValue)) {
        selectedCodes.value = new Set(props.modelValue)
    } else if (typeof props.modelValue === 'string' && props.modelValue) {
        selectedCodes.value = new Set([props.modelValue])
    } else {
        selectedCodes.value = new Set()
    }
}

// 监听modelValue变化
watch(() => props.modelValue, initSelection, { immediate: true })

// 当前显示的列表
const displayList = computed(() => {
    let list: LocationItem[] = []

    if (currentParent.value) {
        // 显示当前父级的子节点
        const parentCode = currentParent.value.code
        if (expandedData.value.has(parentCode)) {
            list = expandedData.value.get(parentCode) || []
        } else {
            list = currentParent.value.children || []
        }
    } else {
        // 显示根节点
        list = props.data
    }

    // 搜索过滤
    if (searchKeyword.value) {
        const keyword = searchKeyword.value.toLowerCase()
        list = filterByKeyword(props.data, keyword)
    }

    return list
})

// 已选择的项目
const selectedItems = computed(() => {
    const items: LocationItem[] = []
    const findItems = (list: LocationItem[]) => {
        list.forEach((item) => {
            if (selectedCodes.value.has(item.code)) {
                items.push(item)
            }
            if (item.children) {
                findItems(item.children)
            }
        })
    }
    findItems(props.data)
    return items
})

// 递归搜索
const filterByKeyword = (list: LocationItem[], keyword: string): LocationItem[] => {
    const result: LocationItem[] = []
    list.forEach((item) => {
        const matchCode = item.code.toLowerCase().includes(keyword)
        const matchName = item.name.toLowerCase().includes(keyword)
        if (matchCode || matchName) {
            result.push(item)
        }
        if (item.children) {
            const childMatches = filterByKeyword(item.children, keyword)
            result.push(...childMatches)
        }
    })
    return result
}

// 是否选中
const isSelected = (item: LocationItem): boolean => {
    return selectedCodes.value.has(item.code)
}

// 处理搜索输入
const handleSearchInput = (event: Event) => {
    const target = event.target as HTMLInputElement
    searchKeyword.value = target.value
}

// 执行搜索
const handleSearch = () => {
    // 搜索时回到根目录
    if (searchKeyword.value) {
        currentParent.value = null
        breadcrumbs.value = []
    }
}

// 清空搜索
const clearSearch = () => {
    searchKeyword.value = ''
}

// 点击项目
const handleItemClick = (item: LocationItem) => {
    if (item.disabled) return

    if (item.children?.length) {
        // 有子节点，展开
        expandItem(item)
    } else if (props.selectable) {
        // 无子节点，选择
        toggleSelect(item)
    }
}

// 展开项目
const expandItem = async (item: LocationItem) => {
    // 懒加载
    if (props.lazy && props.loadChildren && !item.children?.length) {
        loading.value = true
        try {
            const children = await props.loadChildren(item)
            item.children = children
            expandedData.value.set(item.code, children)
        } catch (e) {
            console.error('加载子节点失败:', e)
        } finally {
            loading.value = false
        }
    }

    currentParent.value = item
    breadcrumbs.value.push(item)
    emit('expand', item)
}

// 切换选择
const toggleSelect = (item: LocationItem) => {
    const newSelected = new Set(selectedCodes.value)

    if (props.multiple) {
        if (newSelected.has(item.code)) {
            newSelected.delete(item.code)
        } else {
            if (props.maxCount > 0 && newSelected.size >= props.maxCount) {
                uni.showToast({
                    title: `最多选择${props.maxCount}个`,
                    icon: 'none',
                })
                return
            }
            newSelected.add(item.code)
        }
    } else {
        newSelected.clear()
        newSelected.add(item.code)
    }

    selectedCodes.value = newSelected
    updateModelValue()
}

// 更新modelValue
const updateModelValue = () => {
    const codes = Array.from(selectedCodes.value)
    const value = props.multiple ? codes : codes[0] || ''
    emit('update:modelValue', value)
    emit('change', selectedItems.value)
}

// 返回根目录
const goToRoot = () => {
    currentParent.value = null
    breadcrumbs.value = []
}

// 返回面包屑位置
const goToBreadcrumb = (index: number) => {
    if (index < breadcrumbs.value.length - 1) {
        currentParent.value = breadcrumbs.value[index]
        breadcrumbs.value = breadcrumbs.value.slice(0, index + 1)
    }
}

// 移除已选择项
const removeSelected = (item: LocationItem) => {
    selectedCodes.value.delete(item.code)
    updateModelValue()
}

// 清空选择
const clearSelection = () => {
    selectedCodes.value.clear()
    updateModelValue()
}

// 加载更多
const handleLoadMore = () => {
    // 预留分页加载
}

// 取消
const handleCancel = () => {
    emit('cancel')
}

// 确认
const handleConfirm = () => {
    emit('confirm', selectedItems.value)
}

// 初始化
onMounted(() => {
    initSelection()
})

// 暴露方法
defineExpose({
    clearSelection,
    goToRoot,
    selectedItems,
})
</script>

<style lang="scss" scoped>
.m-location-picker {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: #f5f7fa;

    &__search {
        display: flex;
        align-items: center;
        padding: 16rpx 24rpx;
        background-color: #fff;

        &-input {
            flex: 1;
            height: 64rpx;
            padding: 0 16rpx;
            font-size: 28rpx;
            background-color: #f5f7fa;
            border-radius: 8rpx;
            border: none;
        }

        &-clear {
            padding: 8rpx;
            color: #c0c4cc;
        }

        &-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 64rpx;
            height: 64rpx;
            margin-left: 16rpx;
            background-color: #409eff;
            border-radius: 8rpx;
            color: #fff;
        }
    }

    &__breadcrumb {
        display: flex;
        flex-wrap: wrap;
        padding: 16rpx 24rpx;
        background-color: #fff;
        border-top: 1px solid #ebeef5;

        &-item {
            display: flex;
            align-items: center;
            font-size: 26rpx;
            color: #409eff;

            &:last-child {
                color: #303133;
            }
        }

        &-separator {
            margin: 0 8rpx;
            color: #c0c4cc;
        }
    }

    &__list {
        flex: 1;
        padding: 16rpx;
    }

    &__loading,
    &__empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60rpx 0;
        color: #909399;
        font-size: 28rpx;
    }

    &__loading-icon {
        width: 40rpx;
        height: 40rpx;
        margin-bottom: 16rpx;
        border: 3px solid #409eff;
        border-top-color: transparent;
        border-radius: 50%;
        animation: location-loading 0.8s linear infinite;
    }

    &__loading-more {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24rpx 0;
        color: #909399;
        font-size: 24rpx;

        .m-location-picker__loading-icon {
            width: 28rpx;
            height: 28rpx;
            margin-bottom: 0;
            margin-right: 12rpx;
        }
    }

    &__item {
        display: flex;
        align-items: center;
        padding: 20rpx;
        margin-bottom: 16rpx;
        background-color: #fff;
        border-radius: 12rpx;

        &--selected {
            background-color: #ecf5ff;
        }

        &--disabled {
            opacity: 0.5;
        }

        &-icon {
            width: 48rpx;
            height: 48rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 16rpx;
            font-size: 36rpx;
            color: #409eff;
        }

        &-content {
            flex: 1;
            min-width: 0;
        }

        &-name {
            font-size: 28rpx;
            color: #303133;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        &-code {
            font-size: 24rpx;
            color: #909399;
            margin-top: 4rpx;
        }

        &-arrow {
            padding: 16rpx;
            color: #c0c4cc;
        }

        &-check {
            padding: 8rpx;
        }
    }

    &__checkbox {
        width: 36rpx;
        height: 36rpx;
        border: 2px solid #dcdfe6;
        border-radius: 50%;
        transition: all 0.2s;

        &--checked {
            background-color: #409eff;
            border-color: #409eff;

            &::after {
                content: '';
                display: block;
                width: 10rpx;
                height: 18rpx;
                margin: 6rpx auto;
                border: 2px solid #fff;
                border-top: none;
                border-left: none;
                transform: rotate(45deg);
            }
        }
    }

    &__selected {
        background-color: #fff;
        border-top: 1px solid #ebeef5;

        &-header {
            display: flex;
            justify-content: space-between;
            padding: 16rpx 24rpx;
            font-size: 26rpx;
            color: #606266;
        }

        &-clear {
            color: #409eff;
        }

        &-list {
            white-space: nowrap;
            padding: 0 24rpx 16rpx;
        }

        &-item {
            display: inline-flex;
            align-items: center;
            padding: 8rpx 16rpx;
            margin-right: 16rpx;
            background-color: #ecf5ff;
            border-radius: 8rpx;
            font-size: 24rpx;
            color: #409eff;
        }

        &-remove {
            margin-left: 8rpx;
            font-size: 20rpx;
        }
    }

    &__footer {
        display: flex;
        padding: 16rpx 24rpx;
        background-color: #fff;
        border-top: 1px solid #ebeef5;

        &-btn {
            flex: 1;
            height: 80rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 30rpx;
            border-radius: 8rpx;
            background-color: #f5f7fa;
            color: #606266;

            &:first-child {
                margin-right: 24rpx;
            }

            &--primary {
                background-color: #409eff;
                color: #fff;
            }
        }
    }
}

@keyframes location-loading {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}
</style>
