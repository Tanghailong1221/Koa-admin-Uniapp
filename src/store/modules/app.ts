import { defineStore } from 'pinia'
import type { DeviceType } from '@/types/device'

interface AppState {
    /** 设备类型 */
    deviceType: DeviceType
    /** 网络状态 */
    networkStatus: 'online' | 'offline'
    /** 主题 */
    theme: 'light' | 'dark'
    /** 语言 */
    language: string
    /** 是否显示TabBar */
    showTabBar: boolean
    /** 页面加载状态 */
    loading: boolean
    /** 全局消息 */
    globalMessage: string
}

export const useAppStore = defineStore('app', {
    state: (): AppState => ({
        deviceType: 'phone',
        networkStatus: 'online',
        theme: 'light',
        language: 'zh-CN',
        showTabBar: true,
        loading: false,
        globalMessage: '',
    }),
    getters: {
        isOnline: state => state.networkStatus === 'online',
        isDarkMode: state => state.theme === 'dark',
    },
    actions: {
        setDeviceType(type: DeviceType) {
            this.deviceType = type
        },
        setNetworkStatus(status: 'online' | 'offline') {
            this.networkStatus = status
        },
        setTheme(theme: 'light' | 'dark') {
            this.theme = theme
        },
        toggleTheme() {
            this.theme = this.theme === 'light' ? 'dark' : 'light'
        },
        setLanguage(language: string) {
            this.language = language
        },
        setShowTabBar(show: boolean) {
            this.showTabBar = show
        },
        setLoading(loading: boolean) {
            this.loading = loading
        },
        showMessage(message: string) {
            this.globalMessage = message
            uni.showToast({
                title: message,
                icon: 'none',
                duration: 2000,
            })
        },
        showSuccess(message: string) {
            uni.showToast({
                title: message,
                icon: 'success',
                duration: 2000,
            })
        },
        showError(message: string) {
            uni.showToast({
                title: message,
                icon: 'error',
                duration: 2000,
            })
        },
    },
    persist: {
        key: 'mes-wms-app',
        paths: ['theme', 'language'],
    },
})
