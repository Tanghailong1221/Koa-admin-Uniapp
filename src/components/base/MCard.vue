<template>
    <view class="m-card" :class="{ 'm-card--shadow': shadow, 'm-card--border': border }" :style="cardStyle">
        <view v-if="title || $slots.header" class="m-card__header">
            <slot name="header">
                <view class="m-card__title">{{ title }}</view>
                <view v-if="extra" class="m-card__extra">{{ extra }}</view>
            </slot>
        </view>
        <view class="m-card__body" :style="bodyStyle">
            <slot></slot>
        </view>
        <view v-if="$slots.footer" class="m-card__footer">
            <slot name="footer"></slot>
        </view>
    </view>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'

export interface MCardProps {
    /** 卡片标题 */
    title?: string
    /** 额外内容 */
    extra?: string
    /** 是否显示阴影 */
    shadow?: boolean
    /** 是否显示边框 */
    border?: boolean
    /** 内边距 */
    padding?: string | number
    /** 圆角 */
    radius?: string | number
}

const props = withDefaults(defineProps<MCardProps>(), {
    title: '',
    extra: '',
    shadow: true,
    border: false,
    padding: 24,
    radius: 16,
})

const $slots = useSlots()

const cardStyle = computed(() => {
    const radius = typeof props.radius === 'number' ? `${props.radius}rpx` : props.radius
    return {
        borderRadius: radius,
    }
})

const bodyStyle = computed(() => {
    const padding = typeof props.padding === 'number' ? `${props.padding}rpx` : props.padding
    return {
        padding,
    }
})
</script>

<style lang="scss" scoped>
.m-card {
    background-color: #fff;
    overflow: hidden;

    &--shadow {
        box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
    }

    &--border {
        border: 1px solid #ebeef5;
    }

    &__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 24rpx;
        border-bottom: 1px solid #ebeef5;
    }

    &__title {
        font-size: 32rpx;
        font-weight: 500;
        color: #303133;
    }

    &__extra {
        font-size: 28rpx;
        color: #909399;
    }

    &__body {
        font-size: 28rpx;
        color: #606266;
    }

    &__footer {
        padding: 24rpx;
        border-top: 1px solid #ebeef5;
    }
}
</style>
