/**
 * HTTP请求重试机制
 */
import type { RequestConfig, ResponseData } from '@/types/http'
import { ErrorCode, AppError } from '@/types/error'
import { appConfig } from '@/config/app.config'

/** 重试配置 */
export interface RetryConfig {
    /** 最大重试次数 */
    maxRetry: number
    /** 重试间隔基数（毫秒） */
    retryDelay: number
    /** 是否应该重试的判断函数 */
    shouldRetry?: (error: Error, attempt: number) => boolean
}

/** 默认重试配置 */
export const defaultRetryConfig: RetryConfig = {
    maxRetry: appConfig.maxRetry,
    retryDelay: appConfig.retryDelay,
    shouldRetry: (error: Error) => {
        // 只对网络错误和超时错误进行重试
        if (error instanceof AppError) {
            return [ErrorCode.NETWORK_ERROR, ErrorCode.TIMEOUT_ERROR].includes(error.code)
        }
        return true
    },
}

/** 延迟函数 */
const delay = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/** 计算重试延迟（递增） */
export const calculateRetryDelay = (attempt: number, baseDelay: number): number => {
    // 指数退避：baseDelay * 2^(attempt-1)
    return baseDelay * Math.pow(2, attempt - 1)
}

/** 重试状态 */
export interface RetryState {
    /** 当前重试次数 */
    attempt: number
    /** 最大重试次数 */
    maxRetry: number
    /** 是否已取消 */
    cancelled: boolean
}

/** 创建重试状态 */
export const createRetryState = (maxRetry: number): RetryState => ({
    attempt: 0,
    maxRetry,
    cancelled: false,
})

/**
 * 带重试的请求执行器
 * @param requestFn 请求函数
 * @param config 重试配置
 * @returns 响应数据
 */
export const withRetry = async <T>(
    requestFn: () => Promise<ResponseData<T>>,
    config: Partial<RetryConfig> = {}
): Promise<{ response: ResponseData<T>; retryCount: number }> => {
    const { maxRetry, retryDelay, shouldRetry } = {
        ...defaultRetryConfig,
        ...config,
    }

    const state = createRetryState(maxRetry)
    let lastError: Error | null = null

    while (state.attempt <= maxRetry) {
        try {
            const response = await requestFn()
            return { response, retryCount: state.attempt }
        } catch (error) {
            lastError = error as Error
            state.attempt++

            // 检查是否应该重试
            if (state.attempt > maxRetry) {
                break
            }

            if (shouldRetry && !shouldRetry(lastError, state.attempt)) {
                break
            }

            // 计算延迟并等待
            const delayMs = calculateRetryDelay(state.attempt, retryDelay)
            await delay(delayMs)
        }
    }

    // 所有重试都失败，抛出最后一个错误
    throw lastError || new AppError(ErrorCode.NETWORK_ERROR, '请求失败')
}

/**
 * 获取实际重试次数（用于测试）
 * 执行请求并返回重试次数
 */
export const executeWithRetryCount = async <T>(
    requestFn: () => Promise<ResponseData<T>>,
    config: Partial<RetryConfig> = {}
): Promise<{ success: boolean; retryCount: number; error?: Error }> => {
    try {
        const result = await withRetry(requestFn, config)
        return { success: true, retryCount: result.retryCount }
    } catch (error) {
        // 重试次数 = maxRetry（因为第一次请求不算重试）
        const maxRetry = config.maxRetry ?? defaultRetryConfig.maxRetry
        return { success: false, retryCount: maxRetry, error: error as Error }
    }
}
