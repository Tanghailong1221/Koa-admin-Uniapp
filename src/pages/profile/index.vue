<template>
    <view class="profile-page">
        <!-- 用户信息卡片 -->
        <view class="user-card">
            <view class="avatar">
                <text>{{ userInitial }}</text>
            </view>
            <view class="info">
                <text class="name">{{ userName }}</text>
                <text class="username">@{{ username }}</text>
                <view class="roles">
                    <text v-for="role in userRoles" :key="role" class="role-tag">{{ role }}</text>
                </view>
            </view>
        </view>

        <!-- 功能列表 -->
        <view class="menu-list">
            <view class="menu-group">
                <view class="menu-item" @click="navigateTo('/pages/profile/info')">
                    <text class="icon">👤</text>
                    <text class="label">个人信息</text>
                    <text class="arrow">›</text>
                </view>
                <view class="menu-item" @click="navigateTo('/pages/profile/password')">
                    <text class="icon">🔐</text>
                    <text class="label">修改密码</text>
                    <text class="arrow">›</text>
                </view>
            </view>

            <view class="menu-group">
                <view class="menu-item" @click="navigateTo('/pages/settings/index')">
                    <text class="icon">⚙️</text>
                    <text class="label">系统设置</text>
                    <text class="arrow">›</text>
                </view>
                <view class="menu-item" @click="navigateTo('/pages/settings/theme')">
                    <text class="icon">🎨</text>
                    <text class="label">主题设置</text>
                    <view class="value">
                        <text>{{ currentTheme }}</text>
                    </view>
                    <text class="arrow">›</text>
                </view>
                <view class="menu-item" @click="navigateTo('/pages/settings/language')">
                    <text class="icon">🌐</text>
                    <text class="label">语言设置</text>
                    <view class="value">
                        <text>{{ currentLanguage }}</text>
                    </view>
                    <text class="arrow">›</text>
                </view>
            </view>

            <view class="menu-group">
                <view class="menu-item" @click="navigateTo('/pages/help/index')">
                    <text class="icon">❓</text>
                    <text class="label">帮助中心</text>
                    <text class="arrow">›</text>
                </view>
                <view class="menu-item" @click="navigateTo('/pages/about/index')">
                    <text class="icon">ℹ️</text>
                    <text class="label">关于我们</text>
                    <view class="value">
                        <text>v{{ appVersion }}</text>
                    </view>
                    <text class="arrow">›</text>
                </view>
                <view class="menu-item" @click="checkUpdate">
                    <text class="icon">🔄</text>
                    <text class="label">检查更新</text>
                    <text class="arrow">›</text>
                </view>
            </view>

            <view class="menu-group">
                <view class="menu-item" @click="clearCache">
                    <text class="icon">🗑️</text>
                    <text class="label">清除缓存</text>
                    <view class="value">
                        <text>{{ cacheSize }}</text>
                    </view>
                    <text class="arrow">›</text>
                </view>
            </view>
        </view>

        <!-- 退出登录按钮 -->
        <view class="logout-section">
            <button class="logout-btn" @click="handleLogout">退出登录</button>
        </view>

        <!-- 版权信息 -->
        <view class="footer">
            <text class="copyright">© 2024 MES/WMS System</text>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/modules/user'
import { authService } from '@/services/auth'
import { storageService } from '@/services/storage'

const userStore = useUserStore()

// 用户信息
const userName = computed(() => userStore.userInfo?.realName || '用户')
const username = computed(() => userStore.userInfo?.username || 'user')
const userInitial = computed(() => userName.value.charAt(0).toUpperCase())
const userRoles = computed(() => userStore.userInfo?.roles || ['操作员'])

// 设置信息
const currentTheme = ref('默认')
const currentLanguage = ref('简体中文')
const appVersion = ref('1.0.0')
const cacheSize = ref('0 KB')

/**
 * 计算缓存大小
 */
const calculateCacheSize = () => {
    // 模拟计算缓存大小
    const size = Math.floor(Math.random() * 1000) + 100
    if (size > 1024) {
        cacheSize.value = `${(size / 1024).toFixed(1)} MB`
    } else {
        cacheSize.value = `${size} KB`
    }
}

/**
 * 跳转页面
 */
const navigateTo = (path: string) => {
    uni.navigateTo({
        url: path,
        fail: () => {
            uni.showToast({
                title: '页面开发中',
                icon: 'none',
            })
        },
    })
}

/**
 * 检查更新
 */
const checkUpdate = () => {
    uni.showLoading({
        title: '检查中...',
    })

    setTimeout(() => {
        uni.hideLoading()
        uni.showModal({
            title: '检查更新',
            content: '当前已是最新版本',
            showCancel: false,
        })
    }, 1500)
}

/**
 * 清除缓存
 */
const clearCache = () => {
    uni.showModal({
        title: '清除缓存',
        content: '确定要清除所有缓存数据吗？',
        success: (res) => {
            if (res.confirm) {
                uni.showLoading({
                    title: '清除中...',
                })

                setTimeout(() => {
                    // 清除存储
                    storageService.clear()

                    uni.hideLoading()
                    uni.showToast({
                        title: '清除成功',
                        icon: 'success',
                    })

                    // 重新计算缓存大小
                    cacheSize.value = '0 KB'
                }, 1000)
            }
        },
    })
}

/**
 * 退出登录
 */
const handleLogout = () => {
    uni.showModal({
        title: '退出登录',
        content: '确定要退出当前账号吗？',
        success: async (res) => {
            if (res.confirm) {
                try {
                    await authService.logout()

                    // 跳转到登录页
                    uni.reLaunch({
                        url: '/pages/login/index',
                    })
                } catch (e) {
                    uni.showToast({
                        title: '退出失败',
                        icon: 'none',
                    })
                }
            }
        },
    })
}

onMounted(() => {
    calculateCacheSize()
})
</script>

<style lang="scss" scoped>
.profile-page {
    min-height: 100vh;
    background: #f5f7fa;
    padding-bottom: 40rpx;
}

.user-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 60rpx 32rpx;
    display: flex;
    align-items: center;

    .avatar {
        width: 120rpx;
        height: 120rpx;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 32rpx;

        text {
            font-size: 56rpx;
            color: #fff;
            font-weight: bold;
        }
    }

    .info {
        flex: 1;

        .name {
            font-size: 40rpx;
            color: #fff;
            font-weight: bold;
            display: block;
            margin-bottom: 8rpx;
        }

        .username {
            font-size: 26rpx;
            color: rgba(255, 255, 255, 0.7);
            display: block;
            margin-bottom: 16rpx;
        }

        .roles {
            display: flex;
            flex-wrap: wrap;
            gap: 12rpx;

            .role-tag {
                background: rgba(255, 255, 255, 0.2);
                padding: 6rpx 16rpx;
                border-radius: 20rpx;
                font-size: 22rpx;
                color: #fff;
            }
        }
    }
}

.menu-list {
    padding: 24rpx;

    .menu-group {
        background: #fff;
        border-radius: 16rpx;
        margin-bottom: 24rpx;
        overflow: hidden;

        .menu-item {
            display: flex;
            align-items: center;
            padding: 32rpx;
            border-bottom: 1rpx solid #f5f5f5;

            &:last-child {
                border-bottom: none;
            }

            .icon {
                font-size: 36rpx;
                margin-right: 24rpx;
            }

            .label {
                flex: 1;
                font-size: 30rpx;
                color: #333;
            }

            .value {
                margin-right: 16rpx;

                text {
                    font-size: 26rpx;
                    color: #999;
                }
            }

            .arrow {
                font-size: 32rpx;
                color: #ccc;
            }
        }
    }
}

.logout-section {
    padding: 0 24rpx;
    margin-top: 40rpx;

    .logout-btn {
        width: 100%;
        height: 96rpx;
        background: #fff;
        border: 2rpx solid #ff4d4f;
        border-radius: 16rpx;
        color: #ff4d4f;
        font-size: 32rpx;
        font-weight: bold;
    }
}

.footer {
    padding: 60rpx 0 40rpx;
    text-align: center;

    .copyright {
        font-size: 24rpx;
        color: #999;
    }
}
</style>
