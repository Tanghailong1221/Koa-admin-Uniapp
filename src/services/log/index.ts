/**
 * 日志服务实现
 * 支持多级别日志、本地缓存、批量上传
 */

import type { LogLevel, LogEntry, LogService } from '@/types'
import { storage } from '@/services/storage'

/** 日志存储键 */
const LOG_STORAGE_KEY = 'app_logs'

/** 最大日志条数 */
const MAX_LOG_COUNT = 500

/** 上传批次大小 */
const UPLOAD_BATCH_SIZE = 50

/** 日志配置 */
interface LogConfig {
    /** 是否启用控制台输出 */
    enableConsole: boolean
    /** 最小日志级别 */
    minLevel: LogLevel
    /** 是否启用本地存储 */
    enableStorage: boolean
    /** 日志上传接口 */
    uploadUrl?: string
    /** 是否自动上传 */
    autoUpload: boolean
    /** 自动上传间隔（毫秒） */
    uploadInterval: number
}

/** 默认配置 */
const defaultConfig: LogConfig = {
    enableConsole: true,
    minLevel: 'debug',
    enableStorage: true,
    autoUpload: false,
    uploadInterval: 60000, // 1分钟
}

/** 日志级别优先级 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
}

/** 日志缓存 */
let logCache: LogEntry[] = []

/** 当前配置 */
let currentConfig: LogConfig = { ...defaultConfig }

/** 上传定时器 */
let uploadTimer: ReturnType<typeof setInterval> | null = null

/** 用户信息获取函数 */
let getUserInfo: (() => { id: string; username: string } | undefined) | null = null

/**
 * 获取当前页面路径
 */
const getCurrentPage = (): string => {
    try {
        const pages = getCurrentPages()
        if (pages.length > 0) {
            const currentPage = pages[pages.length - 1]
            return currentPage.route || ''
        }
    } catch {
        // ignore
    }
    return ''
}

/**
 * 获取设备信息
 */
const getDeviceInfo = (): LogEntry['deviceInfo'] => {
    try {
        const systemInfo = uni.getSystemInfoSync()
        return {
            type: systemInfo.deviceType || 'unknown',
            platform: systemInfo.platform || 'unknown',
            screenWidth: systemInfo.screenWidth || 0,
            screenHeight: systemInfo.screenHeight || 0,
        }
    } catch {
        return undefined
    }
}

/**
 * 检查日志级别是否应该记录
 */
const shouldLog = (level: LogLevel): boolean => {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[currentConfig.minLevel]
}

/**
 * 创建日志条目
 */
const createLogEntry = (
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
    error?: Error
): LogEntry => {
    const entry: LogEntry = {
        level,
        message,
        timestamp: Date.now(),
        page: getCurrentPage(),
    }

    if (data) {
        entry.data = data
    }

    if (error) {
        entry.stack = error.stack
        if (!entry.data) {
            entry.data = {}
        }
        entry.data.errorName = error.name
        entry.data.errorMessage = error.message
    }

    // 添加设备信息（仅错误级别）
    if (level === 'error') {
        entry.deviceInfo = getDeviceInfo()
    }

    // 添加用户信息
    if (getUserInfo) {
        entry.userInfo = getUserInfo()
    }

    return entry
}

/**
 * 输出到控制台
 */
const logToConsole = (entry: LogEntry): void => {
    if (!currentConfig.enableConsole) return

    const timestamp = new Date(entry.timestamp).toISOString()
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}]`

    switch (entry.level) {
        case 'debug':
            console.debug(prefix, entry.message, entry.data || '')
            break
        case 'info':
            console.info(prefix, entry.message, entry.data || '')
            break
        case 'warn':
            console.warn(prefix, entry.message, entry.data || '')
            break
        case 'error':
            console.error(prefix, entry.message, entry.data || '', entry.stack || '')
            break
    }
}

/**
 * 保存日志到本地存储
 */
const saveToStorage = async (): Promise<void> => {
    if (!currentConfig.enableStorage) return

    try {
        // 限制日志数量
        if (logCache.length > MAX_LOG_COUNT) {
            logCache = logCache.slice(-MAX_LOG_COUNT)
        }
        await storage.set(LOG_STORAGE_KEY, logCache)
    } catch {
        // ignore storage errors
    }
}

/**
 * 从本地存储加载日志
 */
const loadFromStorage = async (): Promise<void> => {
    if (!currentConfig.enableStorage) return

    try {
        const logs = await storage.get<LogEntry[]>(LOG_STORAGE_KEY)
        if (logs && Array.isArray(logs)) {
            logCache = logs
        }
    } catch {
        logCache = []
    }
}

/**
 * 添加日志条目
 */
const addLogEntry = (entry: LogEntry): void => {
    logCache.push(entry)
    logToConsole(entry)

    // 异步保存到存储
    saveToStorage()
}

/**
 * 上传日志到服务器
 */
const uploadLogs = async (logs: LogEntry[]): Promise<boolean> => {
    if (!currentConfig.uploadUrl || logs.length === 0) {
        return true
    }

    try {
        await new Promise<void>((resolve, reject) => {
            uni.request({
                url: currentConfig.uploadUrl!,
                method: 'POST',
                data: { logs },
                success: () => resolve(),
                fail: (err) => reject(err),
            })
        })
        return true
    } catch {
        return false
    }
}

/**
 * 日志服务实现
 */
export const logService: LogService = {
    /**
     * 调试日志
     */
    debug(message: string, data?: Record<string, unknown>): void {
        if (!shouldLog('debug')) return
        const entry = createLogEntry('debug', message, data)
        addLogEntry(entry)
    },

    /**
     * 信息日志
     */
    info(message: string, data?: Record<string, unknown>): void {
        if (!shouldLog('info')) return
        const entry = createLogEntry('info', message, data)
        addLogEntry(entry)
    },

    /**
     * 警告日志
     */
    warn(message: string, data?: Record<string, unknown>): void {
        if (!shouldLog('warn')) return
        const entry = createLogEntry('warn', message, data)
        addLogEntry(entry)
    },

    /**
     * 错误日志
     */
    error(message: string, error?: Error, data?: Record<string, unknown>): void {
        if (!shouldLog('error')) return
        const entry = createLogEntry('error', message, data, error)
        addLogEntry(entry)
    },

    /**
     * 上传日志
     */
    async flush(): Promise<void> {
        if (logCache.length === 0) return

        // 分批上传
        const logsToUpload = [...logCache]
        let uploadedCount = 0

        for (let i = 0; i < logsToUpload.length; i += UPLOAD_BATCH_SIZE) {
            const batch = logsToUpload.slice(i, i + UPLOAD_BATCH_SIZE)
            const success = await uploadLogs(batch)
            if (success) {
                uploadedCount += batch.length
            } else {
                break
            }
        }

        // 移除已上传的日志
        if (uploadedCount > 0) {
            logCache = logCache.slice(uploadedCount)
            await saveToStorage()
        }
    },

    /**
     * 获取最近日志
     */
    getRecentLogs(count: number = 100): LogEntry[] {
        return logCache.slice(-count)
    },

    /**
     * 清除日志
     */
    clearLogs(): void {
        logCache = []
        storage.remove(LOG_STORAGE_KEY)
    },
}

/**
 * 配置日志服务
 */
export const configureLog = (config: Partial<LogConfig>): void => {
    currentConfig = { ...currentConfig, ...config }

    // 设置自动上传
    if (currentConfig.autoUpload && currentConfig.uploadUrl) {
        if (uploadTimer) {
            clearInterval(uploadTimer)
        }
        uploadTimer = setInterval(() => {
            logService.flush()
        }, currentConfig.uploadInterval)
    } else if (uploadTimer) {
        clearInterval(uploadTimer)
        uploadTimer = null
    }
}

/**
 * 设置用户信息获取函数
 */
export const setUserInfoGetter = (
    getter: () => { id: string; username: string } | undefined
): void => {
    getUserInfo = getter
}

/**
 * 初始化日志服务
 */
export const initLogService = async (config?: Partial<LogConfig>): Promise<void> => {
    if (config) {
        configureLog(config)
    }
    await loadFromStorage()
}

/**
 * 全局错误处理器
 */
export const setupGlobalErrorHandler = (app: {
    config: { errorHandler?: (err: unknown, instance: unknown, info: string) => void }
}): void => {
    // Vue错误处理
    app.config.errorHandler = (err, _instance, info) => {
        logService.error(`Vue Error: ${info}`, err instanceof Error ? err : undefined, {
            info,
            errorType: 'vue',
        })
    }
}

/**
 * 设置Promise错误处理
 */
export const setupPromiseErrorHandler = (): void => {
    // 在UniApp中使用uni.onUnhandledRejection
    uni.onUnhandledRejection?.((res) => {
        logService.error('Unhandled Promise Rejection', undefined, {
            reason: String(res.reason),
            errorType: 'promise',
        })
    })
}

/**
 * 获取日志缓存（用于测试）
 */
export const getLogCache = (): LogEntry[] => {
    return [...logCache]
}

/**
 * 清空日志缓存（用于测试）
 */
export const clearLogCache = (): void => {
    logCache = []
}

export default logService
