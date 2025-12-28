/**
 * 令牌刷新机制
 */
import { ErrorCode, AppError } from '@/types/error'
import { appConfig } from '@/config/app.config'

/** 令牌刷新状态 */
interface TokenRefreshState {
    /** 是否正在刷新 */
    isRefreshing: boolean
    /** 等待刷新的请求队列 */
    pendingRequests: Array<{
        resolve: (token: string) => void
        reject: (error: Error) => void
    }>
}

/** 令牌刷新状态 */
const refreshState: TokenRefreshState = {
    isRefreshing: false,
    pendingRequests: [],
}

/** 获取存储的用户信息 */
const getStoredUser = (): { token: string; refreshToken: string; tokenExpireTime: number } | null => {
    try {
        const userStr = uni.getStorageSync('mes-wms-user')
        if (userStr) {
            return JSON.parse(userStr)
        }
    } catch {
        // ignore
    }
    return null
}

/** 保存令牌 */
const saveToken = (token: string, refreshToken: string, expireTime: number): void => {
    try {
        const userStr = uni.getStorageSync('mes-wms-user')
        if (userStr) {
            const user = JSON.parse(userStr)
            user.token = token
            user.refreshToken = refreshToken
            user.tokenExpireTime = expireTime
            uni.setStorageSync('mes-wms-user', JSON.stringify(user))
        }
    } catch {
        // ignore
    }
}

/** 清除令牌 */
const clearToken = (): void => {
    try {
        uni.removeStorageSync('mes-wms-user')
    } catch {
        // ignore
    }
}

/** 检查令牌是否即将过期 */
export const isTokenExpiringSoon = (): boolean => {
    const user = getStoredUser()
    if (!user || !user.tokenExpireTime) {
        return true
    }

    const now = Date.now()
    const threshold = appConfig.tokenRefreshThreshold * 1000 // 转换为毫秒
    return user.tokenExpireTime - now < threshold
}

/** 检查令牌是否已过期 */
export const isTokenExpired = (): boolean => {
    const user = getStoredUser()
    if (!user || !user.tokenExpireTime) {
        return true
    }

    return Date.now() >= user.tokenExpireTime
}

/** 刷新令牌API调用 */
const callRefreshTokenApi = async (refreshToken: string): Promise<{
    token: string
    refreshToken: string
    expireTime: number
}> => {
    return new Promise((resolve, reject) => {
        uni.request({
            url: `${appConfig.baseUrl}/auth/refresh`,
            method: 'POST',
            data: { refreshToken },
            header: { 'Content-Type': 'application/json' },
            success: (res) => {
                if (res.statusCode === 200) {
                    const data = res.data as {
                        code: number
                        data: { token: string; refreshToken: string; expireTime: number }
                    }
                    if (data.code === 0 || data.code === 200) {
                        resolve(data.data)
                    } else {
                        reject(new AppError(ErrorCode.REFRESH_TOKEN_FAILED, '刷新令牌失败'))
                    }
                } else {
                    reject(new AppError(ErrorCode.REFRESH_TOKEN_FAILED, '刷新令牌失败'))
                }
            },
            fail: () => {
                reject(new AppError(ErrorCode.NETWORK_ERROR, '网络错误'))
            },
        })
    })
}

/**
 * 刷新令牌
 * 使用单例模式，确保同时只有一个刷新请求
 */
export const refreshToken = async (): Promise<string> => {
    const user = getStoredUser()
    if (!user || !user.refreshToken) {
        throw new AppError(ErrorCode.LOGIN_REQUIRED, '请先登录')
    }

    // 如果正在刷新，加入等待队列
    if (refreshState.isRefreshing) {
        return new Promise((resolve, reject) => {
            refreshState.pendingRequests.push({ resolve, reject })
        })
    }

    refreshState.isRefreshing = true

    try {
        const result = await callRefreshTokenApi(user.refreshToken)

        // 保存新令牌
        saveToken(result.token, result.refreshToken, result.expireTime)

        // 通知所有等待的请求
        refreshState.pendingRequests.forEach(({ resolve }) => {
            resolve(result.token)
        })
        refreshState.pendingRequests = []

        return result.token
    } catch (error) {
        // 刷新失败，清除令牌并通知所有等待的请求
        clearToken()

        refreshState.pendingRequests.forEach(({ reject }) => {
            reject(error as Error)
        })
        refreshState.pendingRequests = []

        // 跳转到登录页
        uni.reLaunch({ url: '/pages/login/index' })

        throw error
    } finally {
        refreshState.isRefreshing = false
    }
}

/**
 * 带令牌刷新的请求包装器
 * 在请求前检查令牌，如果即将过期则先刷新
 */
export const withTokenRefresh = async <T>(
    requestFn: () => Promise<T>
): Promise<T> => {
    // 检查令牌是否即将过期
    if (isTokenExpiringSoon() && !isTokenExpired()) {
        try {
            await refreshToken()
        } catch {
            // 刷新失败但令牌未过期，继续请求
        }
    }

    try {
        return await requestFn()
    } catch (error) {
        // 如果是令牌过期错误，尝试刷新后重试
        if (error instanceof AppError && error.code === ErrorCode.TOKEN_EXPIRED) {
            await refreshToken()
            return await requestFn()
        }
        throw error
    }
}
