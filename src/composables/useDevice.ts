/**
 * 设备适配组合式函数
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { DeviceType, DeviceInfo, LayoutConfig, PlatformType } from '@/types/device'
import { DEFAULT_DEVICE_THRESHOLDS } from '@/types/device'
import { layoutConfigs } from '@/config/theme.config'

/** 设备类型阈值 */
const THRESHOLDS = DEFAULT_DEVICE_THRESHOLDS

/**
 * 检测设备类型
 * @param screenWidth 屏幕宽度
 * @returns 设备类型
 */
export const detectDeviceType = (screenWidth: number): DeviceType => {
    if (screenWidth < THRESHOLDS.phoneMaxWidth) {
        return 'phone'
    }
    if (screenWidth < THRESHOLDS.tabletMaxWidth) {
        // 检测是否为PDA设备（通常PDA屏幕在768-1024之间，且有特定特征）
        // 这里简化处理，可以通过UA或其他方式进一步判断
        return 'pda'
    }
    return 'tablet'
}

/**
 * 获取布局配置
 * @param deviceType 设备类型
 * @returns 布局配置
 */
export const getLayoutConfig = (deviceType: DeviceType): LayoutConfig => {
    return layoutConfigs[deviceType] || layoutConfigs.phone
}

/**
 * 检测平台类型
 */
const detectPlatform = (): PlatformType => {
    // #ifdef H5
    return 'h5'
    // #endif
    // #ifdef MP-WEIXIN
    return 'mp-weixin'
    // #endif
    // #ifdef APP-PLUS
    const systemInfo = uni.getSystemInfoSync()
    return systemInfo.platform === 'ios' ? 'ios' : 'android'
    // #endif
    return 'h5'
}

/**
 * 获取设备信息
 */
const getDeviceInfoFromSystem = (): DeviceInfo => {
    try {
        const systemInfo = uni.getSystemInfoSync()
        const screenWidth = systemInfo.screenWidth || 375
        const deviceType = detectDeviceType(screenWidth)

        return {
            type: deviceType,
            platform: detectPlatform(),
            screenWidth,
            screenHeight: systemInfo.screenHeight || 667,
            pixelRatio: systemInfo.pixelRatio || 2,
            statusBarHeight: systemInfo.statusBarHeight || 20,
            safeAreaInsets: {
                top: systemInfo.safeAreaInsets?.top || 0,
                bottom: systemInfo.safeAreaInsets?.bottom || 0,
                left: systemInfo.safeAreaInsets?.left || 0,
                right: systemInfo.safeAreaInsets?.right || 0,
            },
            brand: systemInfo.brand,
            model: systemInfo.model,
            system: systemInfo.system,
            hasScannerHardware: deviceType === 'pda',
        }
    } catch {
        // 返回默认值
        return {
            type: 'phone',
            platform: 'h5',
            screenWidth: 375,
            screenHeight: 667,
            pixelRatio: 2,
            statusBarHeight: 20,
            safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
            hasScannerHardware: false,
        }
    }
}

/** 屏幕尺寸变化回调列表 */
const resizeCallbacks: Array<(info: DeviceInfo) => void> = []

/**
 * 设备适配组合式函数
 */
export function useDevice() {
    const deviceInfo = ref<DeviceInfo>(getDeviceInfoFromSystem())
    const layoutConfig = ref<LayoutConfig>(getLayoutConfig(deviceInfo.value.type))

    const isPhone = computed(() => deviceInfo.value.type === 'phone')
    const isTablet = computed(() => deviceInfo.value.type === 'tablet')
    const isPDA = computed(() => deviceInfo.value.type === 'pda')
    const hasScannerHardware = computed(() => deviceInfo.value.hasScannerHardware || false)

    /**
     * 更新设备信息
     */
    const updateDeviceInfo = () => {
        const newInfo = getDeviceInfoFromSystem()
        deviceInfo.value = newInfo
        layoutConfig.value = getLayoutConfig(newInfo.type)

        // 通知所有回调
        resizeCallbacks.forEach(callback => callback(newInfo))
    }

    /**
     * 监听屏幕尺寸变化
     */
    const onResize = (callback: (info: DeviceInfo) => void) => {
        resizeCallbacks.push(callback)
    }

    /**
     * 移除监听
     */
    const offResize = (callback: (info: DeviceInfo) => void) => {
        const index = resizeCallbacks.indexOf(callback)
        if (index > -1) {
            resizeCallbacks.splice(index, 1)
        }
    }

    // H5环境下监听窗口大小变化
    // #ifdef H5
    let resizeHandler: (() => void) | null = null

    onMounted(() => {
        resizeHandler = () => {
            updateDeviceInfo()
        }
        window.addEventListener('resize', resizeHandler)
    })

    onUnmounted(() => {
        if (resizeHandler) {
            window.removeEventListener('resize', resizeHandler)
        }
    })
    // #endif

    return {
        deviceInfo,
        layoutConfig,
        isPhone,
        isTablet,
        isPDA,
        hasScannerHardware,
        updateDeviceInfo,
        onResize,
        offResize,
        detectDeviceType,
        getLayoutConfig,
    }
}

export default useDevice
