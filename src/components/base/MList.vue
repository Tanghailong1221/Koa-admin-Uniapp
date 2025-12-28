<template>
    <view class="m-list">
        <view v-if="title" class="m-list__header">{{ title }}</view>
        <scroll-view
            class="m-list__content"
            :scroll-y="scrollable"
            :style="contentStyle"
            @scrolltolower="handleScrollToLower"
            @scroll="handleScroll"
        >
            <view v-if="loading && !data.length" class="m-list__loading">
                <view class="m-list__loading-icon"></view>
                <text>{{ loadingText }}</text>
            </view>
            <view v-else-if="!data.length" class="m-list__empty">
                <slot name="empty">
                    <text>{{ emptyText }}</text>
                </slot>
            </view>
            <view v-else class="m-list__items">
                <view
                    v-for="(item, index) in data"
                    :key="getItemKey(item, index)"
                    class="m-list__item"
                    :class="{ 'm-list__item--clickable': clickable }"
                    @click="handleItemClick(item, index)"
                >
                    <slot :item="item" :index="index">
                        <view class="m-list__item-content">
                            <view v-if="item.icon" class="m-list__item-icon">
                                <text :class="item.icon"></text>
                            </view>
                            <view class="m-list__item-main">
                                <view class="m-list__item-title">{{ item.title || item.label || item.name }}</view>
                                <view v-if="item.description" class="m-list__item-desc">{{ item.description }}</view>
                            </view>
                            <view v-if="item.extra" class="m-list__item-extra">{{ item.extra }}</view>
                            <view v-if="showArrow" class="m-list__item-arrow">
                                <text class="m-icon-arrow-right"></text>
                            </view>
                        </view>
                    </slot>
                </view>
            </view>
            <view v-if="loading && data.length" class="m-list__loading-more">
                <view class="m-list__loading-icon"></view>
                <text>{{ loadingText }}</text>
            </view>
            <view v-if="finished && data.length" class="m-list__finished">
                <text>{{ finishedText }}</text>
            </view>
        </scroll-view>
    </view>
</template>

<script setup lang="ts">
import { computed, defineProps, defineEmits } from 'vue'

export interface ListItem {
    id?: string | number
    title?: string
    label?: string
    name?: string
    description?: string
    icon?: string
    extra?: string
    [key: string]: unknown
}

export interface MListProps {
    /** 列表数据 */
    data: ListItem[]
    /** 列表标题 */
    title?: string
    /** 是否可滚动 */
    scrollable?: boolean
    /** 滚动区域高度 */
    height?: string | number
    /** 是否加载中 */
    loading?: boolean
    /** 加载中文本 */
    loadingText?: string
    /** 是否加载完成 */
    finished?: boolean
    /** 加载完成文本 */
    finishedText?: string
    /** 空数据文本 */
    emptyText?: string
    /** 是否可点击 */
    clickable?: boolean
    /** 是否显示箭头 */
    showArrow?: boolean
    /** 唯一键字段 */
    keyField?: string
}

const props = withDefaults(defineProps<MListProps>(), {
    data: () => [],
    title: '',
    scrollable: true,
    height: 'auto',
    loading: false,
    loadingText: '加载中...',
    finished: false,
    finishedText: '没有更多了',
    emptyText: '暂无数据',
    clickable: false,
    showArrow: false,
    keyField: 'id',
})

const emit = defineEmits<{
    (e: 'item-click', item: ListItem, index: number): void
    (e: 'load-more'): void
    (e: 'scroll', event: Event): void
}>()

const contentStyle = computed(() => {
    if (props.height === 'auto') {
        return {}
    }
    const height = typeof props.height === 'number' ? `${props.height}rpx` : props.height
    return { height }
})

const getItemKey = (item: ListItem, index: number): string | number => {
    return item[props.keyField] as string | number ?? index
}

const handleItemClick = (item: ListItem, index: number) => {
    if (props.clickable) {
        emit('item-click', item, index)
    }
}

const handleScrollToLower = () => {
    if (!props.loading && !props.finished) {
        emit('load-more')
    }
}

const handleScroll = (event: Event) => {
    emit('scroll', event)
}
</script>

<style lang="scss" scoped>
.m-list {
    background-color: #fff;

    &__header {
        padding: 24rpx;
        font-size: 32rpx;
        font-weight: 500;
        color: #303133;
        border-bottom: 1px solid #ebeef5;
    }

    &__content {
        width: 100%;
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
        animation: m-list-loading 0.8s linear infinite;
    }

    &__loading-more {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24rpx 0;
        color: #909399;
        font-size: 24rpx;

        .m-list__loading-icon {
            width: 28rpx;
            height: 28rpx;
            margin-bottom: 0;
            margin-right: 12rpx;
        }
    }

    &__finished {
        text-align: center;
        padding: 24rpx 0;
        color: #c0c4cc;
        font-size: 24rpx;
    }

    &__item {
        border-bottom: 1px solid #ebeef5;

        &:last-child {
            border-bottom: none;
        }

        &--clickable {
            cursor: pointer;

            &:active {
                background-color: #f5f7fa;
            }
        }

        &-content {
            display: flex;
            align-items: center;
            padding: 24rpx;
        }

        &-icon {
            margin-right: 20rpx;
            font-size: 40rpx;
            color: #409eff;
        }

        &-main {
            flex: 1;
            min-width: 0;
        }

        &-title {
            font-size: 28rpx;
            color: #303133;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        &-desc {
            font-size: 24rpx;
            color: #909399;
            margin-top: 8rpx;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        &-extra {
            margin-left: 16rpx;
            font-size: 28rpx;
            color: #909399;
        }

        &-arrow {
            margin-left: 8rpx;
            color: #c0c4cc;
        }
    }
}

@keyframes m-list-loading {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}
</style>
