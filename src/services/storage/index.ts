/**
 * 存储服务实现
 */

/** 存储项元数据 */
interface StorageItemMeta {
    /** 过期时间戳 */
    expireAt?: number
    /** 创建时间戳 */
    createdAt: number
}

/** 存储项包装 */
interface StorageItemWrapper<T> {
    /** 数据 */
    data: T
    /** 元数据 */
    meta: StorageItemMeta
}

/** 存储前缀 */
const STORAGE_PREFIX = 'mes_wms_'

/**
 * 序列化数据
 */
export const serialize = <T>(value: T, expire?: number): string => {
    const wrapper: StorageItemWrapper<T> = {
        data: value,
        meta: {
            createdAt: Date.now(),
            expireAt: expire ? Date.now() + expire * 1000 : undefined,
        },
    }
    return JSON.stringify(wrapper)
}

/**
 * 反序列化数据
 */
export const deserialize = <T>(str: string): T | null => {
    try {
        const wrapper: StorageItemWrapper<T> = JSON.parse(str)

        // 检查是否过期
        if (wrapper.meta.expireAt && Date.now() > wrapper.meta.expireAt) {
            return null
        }

        return wrapper.data
    } catch {
        // 兼容旧数据格式
        try {
            return JSON.parse(str) as T
        } catch {
            return null
        }
    }
}

/**
 * 获取完整存储键
 */
const getFullKey = (key: string): string => {
    return `${STORAGE_PREFIX}${key}`
}

/**
 * 同步获取存储数据
 */
export const getSync = <T>(key: string): T | null => {
    try {
        const fullKey = getFullKey(key)
        const str = uni.getStorageSync(fullKey)
        if (!str) return null
        return deserialize<T>(str)
    } catch {
        return null
    }
}

/**
 * 同步设置存储数据
 * @param key 存储键
 * @param value 存储值
 * @param expire 过期时间（秒）
 */
export const setSync = <T>(key: string, value: T, expire?: number): void => {
    try {
        const fullKey = getFullKey(key)
        const str = serialize(value, expire)
        uni.setStorageSync(fullKey, str)
    } catch {
        // ignore
    }
}

/**
 * 同步删除存储数据
 */
export const removeSync = (key: string): void => {
    try {
        const fullKey = getFullKey(key)
        uni.removeStorageSync(fullKey)
    } catch {
        // ignore
    }
}

/**
 * 异步获取存储数据
 */
export const get = <T>(key: string): Promise<T | null> => {
    return new Promise((resolve) => {
        const fullKey = getFullKey(key)
        uni.getStorage({
            key: fullKey,
            success: (res) => {
                const data = deserialize<T>(res.data)
                resolve(data)
            },
            fail: () => {
                resolve(null)
            },
        })
    })
}

/**
 * 异步设置存储数据
 */
export const set = <T>(key: string, value: T, expire?: number): Promise<void> => {
    return new Promise((resolve, reject) => {
        const fullKey = getFullKey(key)
        const str = serialize(value, expire)
        uni.setStorage({
            key: fullKey,
            data: str,
            success: () => resolve(),
            fail: (err) => reject(err),
        })
    })
}

/**
 * 异步删除存储数据
 */
export const remove = (key: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const fullKey = getFullKey(key)
        uni.removeStorage({
            key: fullKey,
            success: () => resolve(),
            fail: (err) => reject(err),
        })
    })
}

/**
 * 清除所有存储数据
 */
export const clear = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        uni.clearStorage({
            success: () => resolve(),
            fail: (err) => reject(err),
        })
    })
}

/**
 * 清除所有带前缀的存储数据
 */
export const clearPrefixed = (): void => {
    try {
        const info = uni.getStorageInfoSync()
        info.keys.forEach((key) => {
            if (key.startsWith(STORAGE_PREFIX)) {
                uni.removeStorageSync(key)
            }
        })
    } catch {
        // ignore
    }
}

/**
 * 获取存储信息
 */
export const getInfo = (): Promise<UniApp.GetStorageInfoSuccess> => {
    return new Promise((resolve, reject) => {
        uni.getStorageInfo({
            success: (res) => resolve(res),
            fail: (err) => reject(err),
        })
    })
}

/**
 * 检查键是否存在
 */
export const has = (key: string): boolean => {
    const value = getSync(key)
    return value !== null
}

/**
 * 获取所有带前缀的键
 */
export const keys = (): string[] => {
    try {
        const info = uni.getStorageInfoSync()
        return info.keys
            .filter((key) => key.startsWith(STORAGE_PREFIX))
            .map((key) => key.slice(STORAGE_PREFIX.length))
    } catch {
        return []
    }
}

/** 存储服务导出 */
export const storageService = {
    get,
    set,
    remove,
    clear,
    getSync,
    setSync,
    removeSync,
    clearPrefixed,
    getInfo,
    has,
    keys,
    serialize,
    deserialize,
}

// 兼容旧名称
export const storage = storageService

export default storageService
