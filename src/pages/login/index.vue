<template>
    <view class="login-page">
        <view class="login-header">
            <image class="logo" src="/static/logo.png" mode="aspectFit" />
            <text class="title">MES/WMS 移动端</text>
            <text class="subtitle">制造执行与仓储管理系统</text>
        </view>

        <view class="login-form">
            <view class="form-item">
                <view class="input-wrapper">
                    <text class="icon">👤</text>
                    <input
                        v-model="loginForm.username"
                        type="text"
                        placeholder="请输入用户名"
                        :disabled="loading"
                        @confirm="handleLogin"
                    />
                </view>
            </view>

            <view class="form-item">
                <view class="input-wrapper">
                    <text class="icon">🔒</text>
                    <input
                        v-model="loginForm.password"
                        :type="showPassword ? 'text' : 'password'"
                        placeholder="请输入密码"
                        :disabled="loading"
                        @confirm="handleLogin"
                    />
                    <text class="toggle-password" @click="showPassword = !showPassword">
                        {{ showPassword ? '🙈' : '👁️' }}
                    </text>
                </view>
            </view>

            <view class="form-options">
                <label class="remember-me" @click="loginForm.rememberMe = !loginForm.rememberMe">
                    <view class="checkbox" :class="{ checked: loginForm.rememberMe }">
                        <text v-if="loginForm.rememberMe">✓</text>
                    </view>
                    <text>记住密码</text>
                </label>
            </view>

            <view class="error-message" v-if="errorMessage">
                <text>{{ errorMessage }}</text>
            </view>

            <button class="login-btn" :disabled="!canLogin || loading" :loading="loading" @click="handleLogin">
                {{ loading ? '登录中...' : '登 录' }}
            </button>
        </view>

        <view class="login-footer">
            <text class="version">v1.0.0</text>
            <text class="copyright">© 2024 MES/WMS System</text>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { authService } from '@/services/auth'
import { storageService } from '@/services/storage'
import { useUserStore } from '@/store/modules/user'

/** 登录表单 */
interface LoginForm {
    username: string
    password: string
    rememberMe: boolean
}

const { isLoggedIn } = useAuth()
const userStore = useUserStore()

// 表单数据
const loginForm = reactive<LoginForm>({
    username: '',
    password: '',
    rememberMe: false,
})

// 状态
const loading = ref(false)
const showPassword = ref(false)
const errorMessage = ref('')

// 计算属性：是否可以登录
const canLogin = computed(() => {
    return loginForm.username.trim() !== '' && loginForm.password.trim() !== ''
})

// 存储键
const REMEMBER_KEY = 'login_remember'
const USERNAME_KEY = 'login_username'

/**
 * 加载记住的用户名
 */
const loadRememberedUser = () => {
    const remembered = storageService.getSync<boolean>(REMEMBER_KEY)
    if (remembered) {
        loginForm.rememberMe = true
        const username = storageService.getSync<string>(USERNAME_KEY)
        if (username) {
            loginForm.username = username
        }
    }
}

/**
 * 保存记住的用户名
 */
const saveRememberedUser = () => {
    if (loginForm.rememberMe) {
        storageService.setSync(REMEMBER_KEY, true)
        storageService.setSync(USERNAME_KEY, loginForm.username)
    } else {
        storageService.removeSync(REMEMBER_KEY)
        storageService.removeSync(USERNAME_KEY)
    }
}

/**
 * 处理登录
 */
const handleLogin = async () => {
    if (!canLogin.value || loading.value) {
        return
    }

    loading.value = true
    errorMessage.value = ''

    // 开发模式下，允许使用演示账号登录
    if (loginForm.username === 'demo' && loginForm.password === 'demo') {
        // 模拟登录成功
        userStore.setUserInfo({
            id: 'demo-user',
            username: 'demo',
            realName: '演示用户',
            roles: ['operator'],
            permissions: ['*'],
            token: 'demo-token',
            refreshToken: 'demo-refresh-token',
            tokenExpireTime: Date.now() + 24 * 60 * 60 * 1000, // 24小时后过期
        })

        saveRememberedUser()
        loading.value = false

        uni.reLaunch({
            url: '/pages/home/index',
        })
        return
    }

    try {
        await authService.login({
            username: loginForm.username,
            password: loginForm.password,
            remember: loginForm.rememberMe,
        })

        // 保存记住的用户名
        saveRememberedUser()

        // 跳转到首页
        uni.reLaunch({
            url: '/pages/home/index',
        })
    } catch (e) {
        errorMessage.value = e instanceof Error ? e.message : '登录失败，请检查网络连接'
    } finally {
        loading.value = false
    }
}

// 页面加载时
onMounted(() => {
    // 如果已登录，直接跳转首页
    if (isLoggedIn.value) {
        uni.reLaunch({
            url: '/pages/home/index',
        })
        return
    }

    // 加载记住的用户名
    loadRememberedUser()
})
</script>

<style lang="scss" scoped>
.login-page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 60rpx 40rpx;
}

.login-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 80rpx;

    .logo {
        width: 160rpx;
        height: 160rpx;
        margin-bottom: 30rpx;
    }

    .title {
        font-size: 48rpx;
        font-weight: bold;
        color: #fff;
        margin-bottom: 16rpx;
    }

    .subtitle {
        font-size: 28rpx;
        color: rgba(255, 255, 255, 0.8);
    }
}

.login-form {
    background: #fff;
    border-radius: 24rpx;
    padding: 60rpx 40rpx;
    box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.15);

    .form-item {
        margin-bottom: 32rpx;

        .input-wrapper {
            display: flex;
            align-items: center;
            background: #f5f7fa;
            border-radius: 12rpx;
            padding: 0 24rpx;
            height: 96rpx;

            .icon {
                font-size: 36rpx;
                margin-right: 20rpx;
            }

            input {
                flex: 1;
                height: 100%;
                font-size: 30rpx;
            }

            .toggle-password {
                font-size: 36rpx;
                padding: 10rpx;
            }
        }
    }

    .form-options {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 40rpx;

        .remember-me {
            display: flex;
            align-items: center;
            font-size: 26rpx;
            color: #666;

            .checkbox {
                width: 36rpx;
                height: 36rpx;
                border: 2rpx solid #ddd;
                border-radius: 6rpx;
                margin-right: 12rpx;
                display: flex;
                align-items: center;
                justify-content: center;

                &.checked {
                    background: #667eea;
                    border-color: #667eea;

                    text {
                        color: #fff;
                        font-size: 24rpx;
                    }
                }
            }
        }
    }

    .error-message {
        background: #fff2f0;
        border: 1rpx solid #ffccc7;
        border-radius: 8rpx;
        padding: 20rpx;
        margin-bottom: 32rpx;

        text {
            color: #ff4d4f;
            font-size: 26rpx;
        }
    }

    .login-btn {
        width: 100%;
        height: 96rpx;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        border-radius: 12rpx;
        color: #fff;
        font-size: 32rpx;
        font-weight: bold;

        &[disabled] {
            opacity: 0.6;
        }
    }
}

.login-footer {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    padding-bottom: 40rpx;

    .version {
        font-size: 24rpx;
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 8rpx;
    }

    .copyright {
        font-size: 22rpx;
        color: rgba(255, 255, 255, 0.4);
    }
}
</style>
