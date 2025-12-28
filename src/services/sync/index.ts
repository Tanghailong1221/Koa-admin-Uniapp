/**
 * 离线同步队列服务
 */
import { storage } from '@/services/storage'
import { http } from '@/services/http'
import { appConfig } from '@/config/app.config'

/** 同步队列项 */
export interface SyncQueueItem {
    /** 唯一ID */
    id: string
    /** 操作类型 */
    type: string
    /** 请求URL */
    url: string
    /** 请求方法 */
    method: 'POST' | 'PUT' | 'DELETE'
    /** 请求数据 */
    data: Record<string, unknown>
    /** 创建时间戳 */
    timestamp: number
    /** 重试次数 */
    retryCount: number
    /** 最大重试次数 */
    maxRetry: number
}

/** 队列存储键 */
const QUEUE_STORAGE_KEY = 'sync_queue'

/** 队列状态 */
interface QueueState {
    /** 是否正在同步 */
    isSyncing: boolean
    /** 队列数据 */
    items: SyncQueueItem[]
}

/** 队列状态 */
const state: QueueState = {
    isSyncing: false,
    items: [],
}

/** 网络状态监听回调 */
const networkCallbacks: Array<(isOnline: boolean) => void> = []

/**
 * 生成唯一ID
 */
const generateId = (): string => {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 从存储加载队列
 */
const loadQueue = (): void => {
    const items = storage.getSync<SyncQueueItem[]>(QUEUE_STORAGE_KEY)
    state.items = items || []
}

/**
 * 保存队列到存储
 */
const saveQueue = (): void => {
    storage.setSync(QUEUE_STORAGE_KEY, state.items)
}

/**
 * 添加到队列
 */
export const addToQueue = (item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>): string => {
    // 检查队列大小限制
    if (state.items.length >= appConfig.maxOfflineQueueSize) {
        // 移除最旧的项
        state.items.shift()
    }

    const newItem: SyncQueueItem = {
        ...item,
        id: generateId(),
        timestamp: Date.now(),
        retryCount: 0,
        maxRetry: item.maxRetry || 3,
    }

    state.items.push(newItem)
    saveQueue()

    return newItem.id
}

/**
 * 从队列移除
 */
export const removeFromQueue = (id: string): boolean => {
    const index = state.items.findIndex(item => item.id === id)
    if (index > -1) {
        state.items.splice(index, 1)
        saveQueue()
        return true
    }
    return false
}

/**
 * 获取队列
 */
export const getQueue = (): SyncQueueItem[] => {
    return [...state.items]
}

/**
 * 获取队列状态
 */
export const getQueueStatus = (): { pending: number; failed: number; total: number } => {
    const failed = state.items.filter(item => item.retryCount >= item.maxRetry).length
    return {
        pending: state.items.length - failed,
        failed,
        total: state.items.length,
    }
}

/**
 * 清空队列
 */
export const clearQueue = (): void => {
    state.items = []
    saveQueue()
}

/**
 * 处理单个队列项
 */
const processItem = async (item: SyncQueueItem): Promise<boolean> => {
    try {
        await http.request({
            url: item.url,
            method: item.method,
            data: item.data,
        })
        return true
    } catch {
        return false
    }
}

/**
 * 处理队列
 */
export const processQueue = async (): Promise<{ success: number; failed: number }> => {
    if (state.isSyncing || state.items.length === 0) {
        return { success: 0, failed: 0 }
    }

    state.isSyncing = true
    let success = 0
    let failed = 0

    // 复制队列以避免处理过程中的修改问题
    const itemsToProcess = [...state.items]

    for (const item of itemsToProcess) {
        const result = await processItem(item)

        if (result) {
            removeFromQueue(item.id)
            success++
        } else {
            // 增加重试次数
            const index = state.items.findIndex(i => i.id === item.id)
            if (index > -1) {
                state.items[index].retryCount++

                // 超过最大重试次数，标记为失败但保留在队列中
                if (state.items[index].retryCount >= state.items[index].maxRetry) {
                    failed++
                }
            }
        }
    }

    saveQueue()
    state.isSyncing = false

    return { success, failed }
}

/**
 * 检查网络状态
 */
const checkNetworkStatus = (): Promise<boolean> => {
    return new Promise((resolve) => {
        uni.getNetworkType({
            success: (res) => {
                resolve(res.networkType !== 'none')
            },
            fail: () => {
                resolve(false)
            },
        })
    })
}

/**
 * 监听网络状态变化
 */
export const onNetworkChange = (callback: (isOnline: boolean) => void): () => void => {
    networkCallbacks.push(callback)

    return () => {
        const index = networkCallbacks.indexOf(callback)
        if (index > -1) {
            networkCallbacks.splice(index, 1)
        }
    }
}

/**
 * 初始化同步服务
 */
export const initSyncService = (): void => {
    // 加载队列
    loadQueue()

    // 监听网络状态变化
    uni.onNetworkStatusChange((res) => {
        const isOnline = res.isConnected

        // 通知所有回调
        networkCallbacks.forEach(callback => callback(isOnline))

        // 网络恢复时自动同步
        if (isOnline && state.items.length > 0) {
            processQueue()
        }
    })

    // 初始检查网络状态
    checkNetworkStatus().then((isOnline) => {
        if (isOnline && state.items.length > 0) {
            processQueue()
        }
    })
}

/** 同步服务导出 */
export const syncService = {
    addToQueue,
    removeFromQueue,
    getQueue,
    getQueueStatus,
    clearQueue,
    processQueue,
    onNetworkChange,
    initSyncService,
}

export default syncService
