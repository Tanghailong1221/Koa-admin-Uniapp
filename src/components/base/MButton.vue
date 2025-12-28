<template>
    <button
        class="m-button"
        :class="[
            `m-button--${type}`,
            `m-button--${size}`,
            { 'm-button--disabled': disabled, 'm-button--loading': loading, 'm-button--block': block },
        ]"
        :disabled="disabled || loading"
        @click="handleClick"
    >
        <view v-if="loading" class="m-button__loading">
            <view class="m-button__loading-icon"></view>
        </view>
        <view v-if="icon && !loading" class="m-button__icon">
            <text :class="icon"></text>
        </view>
        <view class="m-button__text">
            <slot></slot>
        </view>
    </button>
</template>

<script setup lang="ts">
export interface MButtonProps {
    /** 按钮类型 */
    type?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default'
    /** 按钮尺寸 */
    size?: 'large' | 'medium' | 'small' | 'mini'
    /** 是否禁用 */
    disabled?: boolean
    /** 是否加载中 */
    loading?: boolean
    /** 是否块级按钮 */
    block?: boolean
    /** 图标类名 */
    icon?: string
}

const props = withDefaults(defineProps<MButtonProps>(), {
    type: 'default',
    size: 'medium',
    disabled: false,
    loading: false,
    block: false,
    icon: '',
})

const emit = defineEmits<{
    (e: 'click', event: Event): void
}>()

const handleClick = (event: Event) => {
    if (props.disabled || props.loading) return
    emit('click', event)
}
</script>

<style lang="scss" scoped>
.m-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 24rpx;
    border: 1px solid transparent;
    border-radius: 8rpx;
    font-size: 28rpx;
    line-height: 1.5;
    transition: all 0.2s;
    cursor: pointer;

    &--default {
        background-color: #fff;
        border-color: #dcdfe6;
        color: #606266;

        &:active {
            background-color: #f5f7fa;
        }
    }

    &--primary {
        background-color: #409eff;
        border-color: #409eff;
        color: #fff;

        &:active {
            background-color: #3a8ee6;
        }
    }

    &--success {
        background-color: #67c23a;
        border-color: #67c23a;
        color: #fff;

        &:active {
            background-color: #5daf34;
        }
    }

    &--warning {
        background-color: #e6a23c;
        border-color: #e6a23c;
        color: #fff;

        &:active {
            background-color: #cf9236;
        }
    }

    &--danger {
        background-color: #f56c6c;
        border-color: #f56c6c;
        color: #fff;

        &:active {
            background-color: #dd6161;
        }
    }

    &--info {
        background-color: #909399;
        border-color: #909399;
        color: #fff;

        &:active {
            background-color: #82848a;
        }
    }

    &--large {
        height: 88rpx;
        font-size: 32rpx;
        padding: 0 32rpx;
    }

    &--medium {
        height: 72rpx;
        font-size: 28rpx;
    }

    &--small {
        height: 56rpx;
        font-size: 24rpx;
        padding: 0 16rpx;
    }

    &--mini {
        height: 44rpx;
        font-size: 20rpx;
        padding: 0 12rpx;
    }

    &--disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    &--loading {
        cursor: wait;
    }

    &--block {
        display: flex;
        width: 100%;
    }

    &__loading {
        margin-right: 8rpx;

        &-icon {
            width: 28rpx;
            height: 28rpx;
            border: 2px solid currentColor;
            border-top-color: transparent;
            border-radius: 50%;
            animation: m-button-loading 0.8s linear infinite;
        }
    }

    &__icon {
        margin-right: 8rpx;
    }

    &__text {
        display: flex;
        align-items: center;
    }
}

@keyframes m-button-loading {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}
</style>
