<template>
    <view class="m-table" :style="tableStyle">
        <view class="m-table__header" :style="headerStyle">
            <view
                v-for="col in columns"
                :key="col.key"
                class="m-table__cell m-table__header-cell"
                :class="{ 'm-table__cell--fixed': col.fixed }"
                :style="getCellStyle(col)"
            >
                <text>{{ col.title }}</text>
                <view v-if="col.sortable" class="m-table__sort" @click="handleSort(col)">
                    <text
                        class="m-table__sort-icon"
                        :class="{ 'm-table__sort-icon--active': sortKey === col.key && sortOrder === 'asc' }"
                    >↑</text>
                    <text
                        class="m-table__sort-icon"
                        :class="{ 'm-table__sort-icon--active': sortKey === col.key && sortOrder === 'desc' }"
                    >↓</text>
                </view>
            </view>
        </view>
        <scroll-view class="m-table__body" :scroll-y="true" :style="bodyStyle" @scrolltolower="handleLoadMore">
            <view v-if="loading && !data.length" class="m-table__loading">
                <view class="m-table__loading-icon"></view>
                <text>加载中...</text>
            </view>
            <view v-else-if="!data.length" class="m-table__empty">
                <text>{{ emptyText }}</text>
            </view>
            <view v-else>
                <view
                    v-for="(row, rowIndex) in displayData"
                    :key="getRowKey(row, rowIndex)"
                    class="m-table__row"
                    :class="{
                        'm-table__row--selected': isRowSelected(row),
                        'm-table__row--striped': stripe && rowIndex % 2 === 1,
                    }"
                    @click="handleRowClick(row, rowIndex)"
                >
                    <view
                        v-if="selectable"
                        class="m-table__cell m-table__select-cell"
                        @click.stop="handleSelect(row)"
                    >
                        <view
                            class="m-table__checkbox"
                            :class="{ 'm-table__checkbox--checked': isRowSelected(row) }"
                        ></view>
                    </view>
                    <view
                        v-for="col in columns"
                        :key="col.key"
                        class="m-table__cell"
                        :class="{ 'm-table__cell--fixed': col.fixed }"
                        :style="getCellStyle(col)"
                    >
                        <slot :name="col.key" :row="row" :index="rowIndex" :value="getCellValue(row, col)">
                            <text>{{ formatCellValue(row, col) }}</text>
                        </slot>
                    </view>
                </view>
            </view>
            <view v-if="loading && data.length" class="m-table__loading-more">
                <view class="m-table__loading-icon"></view>
                <text>加载中...</text>
            </view>
        </scroll-view>
    </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

export interface TableColumn {
    /** 列键名 */
    key: string
    /** 列标题 */
    title: string
    /** 列宽度 */
    width?: string | number
    /** 最小宽度 */
    minWidth?: string | number
    /** 是否固定 */
    fixed?: 'left' | 'right'
    /** 对齐方式 */
    align?: 'left' | 'center' | 'right'
    /** 是否可排序 */
    sortable?: boolean
    /** 格式化函数 */
    formatter?: (value: unknown, row: Record<string, unknown>) => string
}

export interface MTableProps {
    /** 表格数据 */
    data: Record<string, unknown>[]
    /** 列配置 */
    columns: TableColumn[]
    /** 表格高度 */
    height?: string | number
    /** 是否加载中 */
    loading?: boolean
    /** 空数据文本 */
    emptyText?: string
    /** 是否斑马纹 */
    stripe?: boolean
    /** 是否可选择 */
    selectable?: boolean
    /** 行唯一键 */
    rowKey?: string
    /** 已选择的行 */
    selectedRows?: Record<string, unknown>[]
}

const props = withDefaults(defineProps<MTableProps>(), {
    data: () => [],
    columns: () => [],
    height: 'auto',
    loading: false,
    emptyText: '暂无数据',
    stripe: false,
    selectable: false,
    rowKey: 'id',
    selectedRows: () => [],
})

const emit = defineEmits<{
    (e: 'row-click', row: Record<string, unknown>, index: number): void
    (e: 'select', selectedRows: Record<string, unknown>[]): void
    (e: 'sort-change', key: string, order: 'asc' | 'desc' | null): void
    (e: 'load-more'): void
}>()

const sortKey = ref<string | null>(null)
const sortOrder = ref<'asc' | 'desc' | null>(null)
const selectedRowKeys = ref<Set<string | number>>(new Set())

// 初始化选中状态
watch(
    () => props.selectedRows,
    (rows) => {
        selectedRowKeys.value = new Set(rows.map((row) => row[props.rowKey] as string | number))
    },
    { immediate: true }
)

const tableStyle = computed(() => {
    if (props.height === 'auto') {
        return {}
    }
    const height = typeof props.height === 'number' ? `${props.height}rpx` : props.height
    return { height }
})

const headerStyle = computed(() => ({
    display: 'flex',
}))

const bodyStyle = computed(() => {
    if (props.height === 'auto') {
        return {}
    }
    return { flex: 1 }
})

const displayData = computed(() => {
    let result = [...props.data]

    // 排序
    if (sortKey.value && sortOrder.value) {
        result.sort((a, b) => {
            const aVal = a[sortKey.value!]
            const bVal = b[sortKey.value!]

            if (aVal === bVal) return 0
            if (aVal === null || aVal === undefined) return 1
            if (bVal === null || bVal === undefined) return -1

            const comparison = aVal < bVal ? -1 : 1
            return sortOrder.value === 'asc' ? comparison : -comparison
        })
    }

    return result
})

const getCellStyle = (col: TableColumn) => {
    const style: Record<string, string> = {}

    if (col.width) {
        style.width = typeof col.width === 'number' ? `${col.width}rpx` : col.width
        style.flexShrink = '0'
    } else if (col.minWidth) {
        style.minWidth = typeof col.minWidth === 'number' ? `${col.minWidth}rpx` : col.minWidth
        style.flex = '1'
    } else {
        style.flex = '1'
    }

    if (col.align) {
        style.textAlign = col.align
    }

    return style
}

const getRowKey = (row: Record<string, unknown>, index: number): string | number => {
    return (row[props.rowKey] as string | number) ?? index
}

const getCellValue = (row: Record<string, unknown>, col: TableColumn): unknown => {
    return row[col.key]
}

const formatCellValue = (row: Record<string, unknown>, col: TableColumn): string => {
    const value = getCellValue(row, col)
    if (col.formatter) {
        return col.formatter(value, row)
    }
    if (value === null || value === undefined) {
        return '-'
    }
    return String(value)
}

const isRowSelected = (row: Record<string, unknown>): boolean => {
    const key = row[props.rowKey] as string | number
    return selectedRowKeys.value.has(key)
}

const handleRowClick = (row: Record<string, unknown>, index: number) => {
    emit('row-click', row, index)
}

const handleSelect = (row: Record<string, unknown>) => {
    const key = row[props.rowKey] as string | number
    const newSelected = new Set(selectedRowKeys.value)

    if (newSelected.has(key)) {
        newSelected.delete(key)
    } else {
        newSelected.add(key)
    }

    selectedRowKeys.value = newSelected

    const selectedRows = props.data.filter((r) => newSelected.has(r[props.rowKey] as string | number))
    emit('select', selectedRows)
}

const handleSort = (col: TableColumn) => {
    if (sortKey.value === col.key) {
        if (sortOrder.value === 'asc') {
            sortOrder.value = 'desc'
        } else if (sortOrder.value === 'desc') {
            sortKey.value = null
            sortOrder.value = null
        }
    } else {
        sortKey.value = col.key
        sortOrder.value = 'asc'
    }

    emit('sort-change', col.key, sortOrder.value)
}

const handleLoadMore = () => {
    if (!props.loading) {
        emit('load-more')
    }
}
</script>

<style lang="scss" scoped>
.m-table {
    display: flex;
    flex-direction: column;
    background-color: #fff;
    border: 1px solid #ebeef5;
    border-radius: 8rpx;
    overflow: hidden;

    &__header {
        display: flex;
        background-color: #f5f7fa;
        border-bottom: 1px solid #ebeef5;
    }

    &__header-cell {
        font-weight: 500;
        color: #303133;
    }

    &__body {
        flex: 1;
        overflow: auto;
    }

    &__row {
        display: flex;
        border-bottom: 1px solid #ebeef5;

        &:last-child {
            border-bottom: none;
        }

        &--selected {
            background-color: #ecf5ff;
        }

        &--striped {
            background-color: #fafafa;
        }

        &:active {
            background-color: #f5f7fa;
        }
    }

    &__cell {
        display: flex;
        align-items: center;
        padding: 20rpx 16rpx;
        font-size: 26rpx;
        color: #606266;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        &--fixed {
            position: sticky;
            background-color: inherit;
            z-index: 1;
        }
    }

    &__select-cell {
        width: 60rpx;
        flex-shrink: 0;
        justify-content: center;
    }

    &__checkbox {
        width: 32rpx;
        height: 32rpx;
        border: 2px solid #dcdfe6;
        border-radius: 4rpx;
        transition: all 0.2s;

        &--checked {
            background-color: #409eff;
            border-color: #409eff;

            &::after {
                content: '';
                display: block;
                width: 8rpx;
                height: 16rpx;
                margin: 4rpx auto;
                border: 2px solid #fff;
                border-top: none;
                border-left: none;
                transform: rotate(45deg);
            }
        }
    }

    &__sort {
        display: flex;
        flex-direction: column;
        margin-left: 8rpx;
        cursor: pointer;
    }

    &__sort-icon {
        font-size: 16rpx;
        line-height: 1;
        color: #c0c4cc;

        &--active {
            color: #409eff;
        }
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
        animation: m-table-loading 0.8s linear infinite;
    }

    &__loading-more {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24rpx 0;
        color: #909399;
        font-size: 24rpx;

        .m-table__loading-icon {
            width: 28rpx;
            height: 28rpx;
            margin-bottom: 0;
            margin-right: 12rpx;
        }
    }
}

@keyframes m-table-loading {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}
</style>
