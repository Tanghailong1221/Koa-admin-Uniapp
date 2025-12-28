<template>
    <view class="home-page">
        <!-- 顶部用户信息 -->
        <view class="header">
            <view class="user-info">
                <view class="avatar">
                    <text>{{ userInitial }}</text>
                </view>
                <view class="info">
                    <text class="name">{{ userName }}</text>
                    <text class="role">{{ userRole }}</text>
                </view>
            </view>
            <view class="actions">
                <view class="notification" @click="goToNotifications">
                    <text class="icon">🔔</text>
                    <view class="badge" v-if="unreadCount > 0">
                        <text>{{ unreadCount > 99 ? '99+' : unreadCount }}</text>
                    </view>
                </view>
            </view>
        </view>

        <!-- 快捷功能入口 -->
        <view class="quick-actions">
            <view class="section-title">
                <text>快捷功能</text>
            </view>
            <view class="action-grid">
                <view
                    v-for="action in quickActions"
                    :key="action.id"
                    class="action-item"
                    @click="handleAction(action)"
                >
                    <view class="icon-wrapper" :style="{ background: action.color }">
                        <text class="icon">{{ action.icon }}</text>
                    </view>
                    <text class="label">{{ action.label }}</text>
                </view>
            </view>
        </view>

        <!-- 功能菜单 -->
        <view class="menu-section">
            <view class="section-title">
                <text>功能菜单</text>
            </view>
            <view class="menu-groups">
                <view v-for="group in menuGroups" :key="group.id" class="menu-group">
                    <view class="group-header">
                        <text class="group-icon">{{ group.icon }}</text>
                        <text class="group-name">{{ group.name }}</text>
                    </view>
                    <view class="group-items">
                        <view
                            v-for="item in group.items"
                            :key="item.id"
                            class="menu-item"
                            @click="navigateTo(item.path)"
                        >
                            <text class="item-icon">{{ item.icon }}</text>
                            <text class="item-name">{{ item.name }}</text>
                            <text class="arrow">›</text>
                        </view>
                    </view>
                </view>
            </view>
        </view>

        <!-- 统计概览 -->
        <view class="stats-section">
            <view class="section-title">
                <text>今日概览</text>
            </view>
            <view class="stats-grid">
                <view v-for="stat in todayStats" :key="stat.id" class="stat-item">
                    <text class="stat-value">{{ stat.value }}</text>
                    <text class="stat-label">{{ stat.label }}</text>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useUserStore } from '@/store/modules/user'

/** 快捷操作 */
interface QuickAction {
    id: string
    icon: string
    label: string
    color: string
    path: string
}

/** 菜单项 */
interface MenuItem {
    id: string
    icon: string
    name: string
    path: string
    permission?: string
}

/** 菜单组 */
interface MenuGroup {
    id: string
    icon: string
    name: string
    items: MenuItem[]
}

/** 统计项 */
interface StatItem {
    id: string
    label: string
    value: string | number
}

const { hasPermission } = useAuth()
const userStore = useUserStore()

// 用户信息
const userName = computed(() => userStore.userInfo?.realName || userStore.userInfo?.username || '用户')
const userRole = computed(() => userStore.userInfo?.roles?.[0] || '操作员')
const userInitial = computed(() => userName.value.charAt(0).toUpperCase())

// 未读消息数
const unreadCount = ref(3)

// 快捷操作
const quickActions = ref<QuickAction[]>([
    { id: 'scan', icon: '📷', label: '扫码', color: '#667eea', path: '/pages/scan/index' },
    { id: 'report', icon: '📝', label: '报工', color: '#52c41a', path: '/pages/work-report/index' },
    { id: 'inventory', icon: '📦', label: '库存', color: '#fa8c16', path: '/pages/inventory/index' },
    { id: 'equipment', icon: '🔧', label: '设备', color: '#13c2c2', path: '/pages/equipment/index' },
])

// 功能菜单
const menuGroups = ref<MenuGroup[]>([
    {
        id: 'production',
        icon: '🏭',
        name: '生产管理',
        items: [
            { id: 'work-order', icon: '📋', name: '工单管理', path: '/pages/work-order/index' },
            { id: 'work-report', icon: '📝', name: '工序报工', path: '/pages/work-report/index' },
            { id: 'quality', icon: '✅', name: '质量检验', path: '/pages/quality/index' },
        ],
    },
    {
        id: 'warehouse',
        icon: '🏪',
        name: '仓储管理',
        items: [
            { id: 'inbound', icon: '📥', name: '入库操作', path: '/pages/inventory/inbound' },
            { id: 'outbound', icon: '📤', name: '出库操作', path: '/pages/inventory/outbound' },
            { id: 'transfer', icon: '🔄', name: '移库操作', path: '/pages/inventory/transfer' },
            { id: 'stocktake', icon: '📊', name: '库存盘点', path: '/pages/inventory/stocktake' },
        ],
    },
    {
        id: 'equipment',
        icon: '⚙️',
        name: '设备管理',
        items: [
            { id: 'equipment-status', icon: '📡', name: '设备状态', path: '/pages/equipment/index' },
            { id: 'maintenance', icon: '🔧', name: '设备维护', path: '/pages/equipment/maintenance' },
        ],
    },
    {
        id: 'exception',
        icon: '⚠️',
        name: '异常管理',
        items: [
            { id: 'exception-report', icon: '📢', name: '异常上报', path: '/pages/exception/report' },
            { id: 'exception-handle', icon: '🛠️', name: '异常处理', path: '/pages/exception/handle' },
        ],
    },
])

// 今日统计
const todayStats = ref<StatItem[]>([
    { id: 'orders', label: '待处理工单', value: 12 },
    { id: 'reports', label: '今日报工', value: 45 },
    { id: 'inventory', label: '库存操作', value: 28 },
    { id: 'exceptions', label: '待处理异常', value: 3 },
])

/**
 * 处理快捷操作
 */
const handleAction = (action: QuickAction) => {
    navigateTo(action.path)
}

/**
 * 跳转页面
 */
const navigateTo = (path: string) => {
    uni.navigateTo({
        url: path,
        fail: () => {
            uni.showToast({
                title: '页面不存在',
                icon: 'none',
            })
        },
    })
}

/**
 * 跳转到通知页面
 */
const goToNotifications = () => {
    navigateTo('/pages/notifications/index')
}

/**
 * 加载统计数据
 */
const loadStats = async () => {
    // TODO: 从API加载实际数据
}

onMounted(() => {
    loadStats()
})
</script>

<style lang="scss" scoped>
.home-page {
    min-height: 100vh;
    background: #f5f7fa;
    padding-bottom: 40rpx;
}

.header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 60rpx 32rpx 40rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .user-info {
        display: flex;
        align-items: center;

        .avatar {
            width: 88rpx;
            height: 88rpx;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 24rpx;

            text {
                font-size: 40rpx;
                color: #fff;
                font-weight: bold;
            }
        }

        .info {
            display: flex;
            flex-direction: column;

            .name {
                font-size: 36rpx;
                color: #fff;
                font-weight: bold;
                margin-bottom: 8rpx;
            }

            .role {
                font-size: 24rpx;
                color: rgba(255, 255, 255, 0.8);
            }
        }
    }

    .actions {
        .notification {
            position: relative;
            padding: 16rpx;

            .icon {
                font-size: 48rpx;
            }

            .badge {
                position: absolute;
                top: 8rpx;
                right: 8rpx;
                background: #ff4d4f;
                border-radius: 20rpx;
                padding: 2rpx 12rpx;
                min-width: 32rpx;

                text {
                    font-size: 20rpx;
                    color: #fff;
                }
            }
        }
    }
}

.section-title {
    padding: 32rpx 32rpx 20rpx;

    text {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
    }
}

.quick-actions {
    background: #fff;
    margin: -20rpx 24rpx 24rpx;
    border-radius: 16rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);

    .action-grid {
        display: flex;
        padding: 0 16rpx 32rpx;

        .action-item {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;

            .icon-wrapper {
                width: 96rpx;
                height: 96rpx;
                border-radius: 24rpx;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 16rpx;

                .icon {
                    font-size: 44rpx;
                }
            }

            .label {
                font-size: 26rpx;
                color: #666;
            }
        }
    }
}

.menu-section {
    background: #fff;
    margin: 0 24rpx 24rpx;
    border-radius: 16rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);

    .menu-groups {
        padding: 0 32rpx 24rpx;

        .menu-group {
            margin-bottom: 24rpx;

            &:last-child {
                margin-bottom: 0;
            }

            .group-header {
                display: flex;
                align-items: center;
                padding: 16rpx 0;
                border-bottom: 1rpx solid #f0f0f0;

                .group-icon {
                    font-size: 32rpx;
                    margin-right: 12rpx;
                }

                .group-name {
                    font-size: 28rpx;
                    font-weight: bold;
                    color: #333;
                }
            }

            .group-items {
                .menu-item {
                    display: flex;
                    align-items: center;
                    padding: 24rpx 0;
                    border-bottom: 1rpx solid #f5f5f5;

                    &:last-child {
                        border-bottom: none;
                    }

                    .item-icon {
                        font-size: 28rpx;
                        margin-right: 16rpx;
                    }

                    .item-name {
                        flex: 1;
                        font-size: 28rpx;
                        color: #333;
                    }

                    .arrow {
                        font-size: 32rpx;
                        color: #ccc;
                    }
                }
            }
        }
    }
}

.stats-section {
    background: #fff;
    margin: 0 24rpx;
    border-radius: 16rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);

    .stats-grid {
        display: flex;
        flex-wrap: wrap;
        padding: 0 16rpx 24rpx;

        .stat-item {
            width: 50%;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 24rpx 0;

            .stat-value {
                font-size: 48rpx;
                font-weight: bold;
                color: #667eea;
                margin-bottom: 8rpx;
            }

            .stat-label {
                font-size: 24rpx;
                color: #999;
            }
        }
    }
}
</style>
