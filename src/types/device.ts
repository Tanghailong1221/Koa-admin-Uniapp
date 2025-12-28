/**
 * 设备适配相关类型定义
 */

/** 设备类型 */
export type DeviceType = 'phone' | 'tablet' | 'pda'

/** 平台类型 */
export type PlatformType = 'android' | 'ios' | 'h5' | 'mp-weixin'

/** 设备信息 */
export interface DeviceInfo {
    /** 设备类型 */
    type: DeviceType
    /** 平台类型 */
    platform: PlatformType
    /** 屏幕宽度 */
    screenWidth: number
    /** 屏幕高度 */
    screenHeight: number
    /** 像素比 */
    pixelRatio: number
    /** 状态栏高度 */
    statusBarHeight: number
    /** 安全区域 */
    safeAreaInsets: SafeAreaInsets
    /** 设备品牌 */
    brand?: string
    /** 设备型号 */
    model?: string
    /** 系统版本 */
    system?: string
    /** 是否支持扫码硬件 */
    hasScannerHardware?: boolean
}

/** 安全区域 */
export interface SafeAreaInsets {
    /** 顶部 */
    top: number
    /** 底部 */
    bottom: number
    /** 左侧 */
    left: number
    /** 右侧 */
    right: number
}

/** 布局配置 */
export interface LayoutConfig {
    /** 列数 */
    columns: number
    /** 间距 */
    gutter: number
    /** 字体大小 */
    fontSize: FontSizeConfig
    /** 触控区域 */
    touchArea: TouchAreaConfig
}

/** 字体大小配置 */
export interface FontSizeConfig {
    /** 基础字号 */
    base: number
    /** 小字号 */
    small: number
    /** 大字号 */
    large: number
}

/** 触控区域配置 */
export interface TouchAreaConfig {
    /** 最小宽度 */
    minWidth: number
    /** 最小高度 */
    minHeight: number
}

/** 设备适配器接口 */
export interface DeviceAdapter {
    /** 获取设备信息 */
    getDeviceInfo(): DeviceInfo
    /** 获取布局配置 */
    getLayoutConfig(): LayoutConfig
    /** 检测设备类型 */
    detectDeviceType(screenWidth: number): DeviceType
    /** 监听屏幕尺寸变化 */
    onResize(callback: (info: DeviceInfo) => void): void
    /** 移除监听 */
    offResize(callback: (info: DeviceInfo) => void): void
}

/** 设备类型阈值配置 */
export interface DeviceThresholds {
    /** 手机最大宽度 */
    phoneMaxWidth: number
    /** 平板最大宽度 */
    tabletMaxWidth: number
}

/** 默认设备阈值 */
export const DEFAULT_DEVICE_THRESHOLDS: DeviceThresholds = {
    phoneMaxWidth: 768,
    tabletMaxWidth: 1024,
}
