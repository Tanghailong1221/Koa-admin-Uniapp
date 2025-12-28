<template>
    <view class="m-work-order-card" :class="[`m-work-order-card--${status}`]" @click="handleClick">
        <!-- 头部 -->
        <view class="m-work-order-card__header">
            <view class="m-work-order-card__order-no">
                <text class="m-work-order-card__label">工单号</text>
                <text class="m-work-order-card__value">{{ orderNo }}</text>
            </view>
            <view class="m-work-order-card__status" :class="[`m-work-order-card__status--${status}`]">
                {{ statusText }}
            </view>
        </view>

        <!-- 产品信息 -->
        <view class="m-work-order-card__product">
            <text class="m-work-order-card__product-code">{{ productCode }}</text>
            <text class="m-work-order-card__product-name">{{ productName }}</text>
        </view>

        <!-- 进度条 -->
        <view class="m-work-order-card__progress">
            <view class="m-work-order-card__progress-bar">
                <view class="m-work-order-card__progress-fill" :style="{ width: progressPercent + '%' }"></view>
            </view>
            <view class="m-work-order-card__progress-text">
                <text>{{ completedQty }}/{{ planQty }}</text>
                <text class="m-work-order-card__progress-percent">{{ progressPercent }}%</text>
            </view>
        </view>

        <!-- 时间信息 -->
        <view class="m-work-order-card__time">
            <view class="m-work-order-card__time-item">
                <text class="m-work-order-card__time-label">计划开始</text>
                <text class="m-work-order-card__time-value">{{ formatTime(planStartTime) }}</text>
            </view>
            <view class="m-work-order-card__time-item">
                <text class="m-work-order-card__time-label">计划结束</text>
                <text class="m-work-order-card__time-value">{{ formatTime(planEndTime) }}</text>
            </view>
        </view>

        <!-- 优先级标识 -->
        <view v-if="priority > 0" class="m-work-order-card__priority" :class="[`m-work-order-card__priority--${priorityLevel}`]">
            {{ priorityText }}
        </view>

        <!-- 底部操作区 -->
        <view v-if="showActions" class="m-work-order-card__actions">
            <slot name="actions">
                <view class="m-work-order-card__action" @click.stop="handleAction('detail')">
                    <text>详情</text>
                </view>
                <view v-if="status === 'pending'" class="m-work-order-card__action m-work-order-card__action--primary" @click.stop="handleAction('start')">
                    <text>开工</text>
                </view>
                <view v-if="status === 'processing'" class="m-work-order-card__action m-work-order-card__action--primary" @click.stop="handleAction('report')">
                    <text>报工</text>
                </view>
            </slot>
        </view>
    </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface MWorkOrderCardProps {
    /** 工单ID */
    id?: string
    /** 工单号 */
    orderNo: string
    /** 产品编码 */
    productCode: string
    /** 产品名称 */
    productName: string
    /** 计划数量 */
    planQty: number
    /** 完成数量 */
    completedQty?: number
    /** 工单状态 */
    status?: 'pending' | 'processing' | 'completed' | 'closed'
    /** 优先级 (0-3, 0最低) */
    priority?: number
    /** 计划开始时间 */
    planStartTime?: string
    /** 计划结束时间 */
    planEndTime?: string
    /** 是否显示操作按钮 */
    showActions?: boolean
}

const props = withDefaults(defineProps<MWorkOrderCardProps>(), {
    id: '',
    completedQty: 0,
    status: 'pending',
    priority: 0,
    planStartTime: '',
    planEndTime: '',
    showActions: true,
})

const emit = defineEmits<{
    (e: 'click', data: MWorkOrderCardProps): void
    (e: 'action', action: string, data: MWorkOrderCardProps): void
}>()

// 状态文本映射
const statusTextMap: Record<string, string> = {
    pending: '待开工',
    processing: '生产中',
    completed: '已完成',
    closed: '已关闭',
}

// 优先级文本映射
const priorityTextMap: Record<number, string> = {
    1: '低',
    2: '中',
    3: '高',
}

// 状态文本
const statusText = computed(() => statusTextMap[props.status] || '未知')

// 进度百分比
const progressPercent = computed(() => {
    if (props.planQty <= 0) return 0
    const percent = Math.round((props.completedQty / props.planQty) * 100)
    return Math.min(percent, 100)
})

// 优先级等级
const priorityLevel = computed(() => {
    if (props.priority >= 3) return 'high'
    if (props.priority >= 2) return 'medium'
    if (props.priority >= 1) return 'low'
    return ''
})

// 优先级文本
const priorityText = computed(() => priorityTextMap[props.priority] || '')

// 格式化时间
const formatTime = (time: string): string => {
    if (!time) return '-'
    try {
        const date = new Date(time)
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        return `${month}-${day} ${hours}:${minutes}`
    } catch {
        return time
    }
}

// 点击卡片
const handleClick = () => {
    emit('click', { ...props })
}

// 操作按钮点击
const handleAction = (action: string) => {
    emit('action', action, { ...props })
}
</script>

<style lang="scss" scoped>
.m-work-order-card {
    position: relative;
    background-color: #fff;
    border-radius: 16rpx;
    padding: 24rpx;
    margin-bottom: 24rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
    overflow: hidden;

    &--pending {
        border-left: 6rpx solid #909399;
    }

    &--processing {
        border-left: 6rpx solid #409eff;
    }

    &--completed {
        border-left: 6rpx solid #67c23a;
    }

    &--closed {
        border-left: 6rpx solid #c0c4cc;
    }

    &__header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16rpx;
    }

    &__order-no {
        display: flex;
        flex-direction: column;
    }

    &__label {
        font-size: 24rpx;
        color: #909399;
    }

    &__value {
        font-size: 32rpx;
        font-weight: 600;
        color: #303133;
        margin-top: 4rpx;
    }

    &__status {
        padding: 8rpx 16rpx;
        border-radius: 8rpx;
        font-size: 24rpx;

        &--pending {
            background-color: #f4f4f5;
            color: #909399;
        }

        &--processing {
            background-color: #ecf5ff;
            color: #409eff;
        }

        &--completed {
            background-color: #f0f9eb;
            color: #67c23a;
        }

        &--closed {
            background-color: #f5f7fa;
            color: #c0c4cc;
        }
    }

    &__product {
        margin-bottom: 16rpx;

        &-code {
            font-size: 26rpx;
            color: #606266;
            margin-right: 16rpx;
        }

        &-name {
            font-size: 28rpx;
            color: #303133;
        }
    }

    &__progress {
        margin-bottom: 16rpx;

        &-bar {
            height: 12rpx;
            background-color: #ebeef5;
            border-radius: 6rpx;
            overflow: hidden;
        }

        &-fill {
            height: 100%;
            background: linear-gradient(90deg, #409eff, #67c23a);
            border-radius: 6rpx;
            transition: width 0.3s ease;
        }

        &-text {
            display: flex;
            justify-content: space-between;
            margin-top: 8rpx;
            font-size: 24rpx;
            color: #909399;
        }

        &-percent {
            color: #409eff;
            font-weight: 500;
        }
    }

    &__time {
        display: flex;
        justify-content: space-between;
        padding-top: 16rpx;
        border-top: 1px solid #ebeef5;

        &-item {
            display: flex;
            flex-direction: column;
        }

        &-label {
            font-size: 22rpx;
            color: #c0c4cc;
        }

        &-value {
            font-size: 24rpx;
            color: #606266;
            margin-top: 4rpx;
        }
    }

    &__priority {
        position: absolute;
        top: 0;
        right: 0;
        padding: 4rpx 16rpx;
        font-size: 20rpx;
        border-radius: 0 16rpx 0 16rpx;

        &--low {
            background-color: #f0f9eb;
            color: #67c23a;
        }

        &--medium {
            background-color: #fdf6ec;
            color: #e6a23c;
        }

        &--high {
            background-color: #fef0f0;
            color: #f56c6c;
        }
    }

    &__actions {
        display: flex;
        justify-content: flex-end;
        gap: 16rpx;
        margin-top: 16rpx;
        padding-top: 16rpx;
        border-top: 1px solid #ebeef5;
    }

    &__action {
        padding: 12rpx 24rpx;
        font-size: 26rpx;
        color: #606266;
        background-color: #f5f7fa;
        border-radius: 8rpx;

        &:active {
            background-color: #ebeef5;
        }

        &--primary {
            background-color: #409eff;
            color: #fff;

            &:active {
                background-color: #3a8ee6;
            }
        }
    }
}
</style>
