/**
 * HTTP服务核心实现
 */
import type {
    RequestConfig,
    ResponseData,
    HttpMethod,
} from '@/types/http'
import { ErrorCode, AppError } from '@/types/error'
import { appConfig } from '@/config/app.config'

/** 请求取消控制器映射 */
const cancelControllers = new Map<string, AbortController>()

/** 获取存储的token */
const getToken = (): string => {
    try {
        const userStr = uni.getStorageSync('mes-wms-user')
        if (userStr) {
            const user = JSON.parse(userStr)
            return user.token || ''
        }
    } catch {
        // ignore
    }
    return ''
}

/** 获取设备信息 */
const getDeviceInfo = (): Record<string, string> => {
    try {
        const systemInfo = uni.getSystemInfoSync()
        return {
            'X-Device-Type': systemInfo.deviceType || 'unknown',
            'X-Platform': systemInfo.platform || 'unknown',
            'X-System': systemInfo.system || 'unknown',
        }
    } catch {
        return {}
    }
}

/** 生成请求签名 */
const generateSignature = (url: string, timestamp: number): string => {
    // 简单签名实现，实际项目中应使用更安全的签名算法
    const str = `${url}${timestamp}`
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
    }
    return Math.abs(hash).toString(16)
}

/** 添加请求头 */
export const addRequestHeaders = (
    config: RequestConfig,
    token: string
): Record<string, string> => {
    const timestamp = Date.now()
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Timestamp': timestamp.toString(),
        'X-Signature': generateSignature(config.url, timestamp),
        ...getDeviceInfo(),
        ...config.headers,
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    return headers
}

/** 解析响应数据 */
export const parseResponse = <T>(data: unknown): ResponseData<T> => {
    // 如果已经是标准格式，直接返回
    if (
        data &&
        typeof data === 'object' &&
        'code' in data &&
        'message' in data &&
        'data' in data &&
        'timestamp' in data
    ) {
        return data as ResponseData<T>
    }

    // 包装为标准格式
    return {
        code: 0,
        message: 'success',
        data: data as T,
        timestamp: Date.now(),
    }
}

/** 发起请求 */
const request = async <T>(config: RequestConfig): Promise<ResponseData<T>> => {
    const {
        url,
        method,
        data,
        params,
        timeout = appConfig.timeout,
        cancelToken,
        showLoading = false,
        showError = true,
    } = config

    // 构建完整URL
    let fullUrl = url.startsWith('http') ? url : `${appConfig.baseUrl}${url}`

    // 添加查询参数
    if (params && Object.keys(params).length > 0) {
        const queryString = Object.entries(params)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
            .join('&')
        fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryString
    }

    // 获取token并添加请求头
    const token = getToken()
    const headers = addRequestHeaders({ ...config, url: fullUrl }, token)

    // 创建取消控制器
    let abortController: AbortController | undefined
    if (cancelToken) {
        abortController = new AbortController()
        cancelControllers.set(cancelToken, abortController)
    }

    // 显示加载提示
    if (showLoading) {
        uni.showLoading({ title: '加载中...', mask: true })
    }

    try {
        const response = await new Promise<UniApp.RequestSuccessCallbackResult>((resolve, reject) => {
            const requestTask = uni.request({
                url: fullUrl,
                method: method as 'GET' | 'POST' | 'PUT' | 'DELETE',
                data,
                header: headers,
                timeout,
                success: resolve,
                fail: reject,
            })

            // 监听取消信号
            if (abortController) {
                abortController.signal.addEventListener('abort', () => {
                    requestTask.abort()
                    reject(new AppError(ErrorCode.ABORT_ERROR, '请求已取消'))
                })
            }
        })

        // 隐藏加载提示
        if (showLoading) {
            uni.hideLoading()
        }

        // 清理取消控制器
        if (cancelToken) {
            cancelControllers.delete(cancelToken)
        }

        // 检查HTTP状态码
        const statusCode = response.statusCode
        if (statusCode < 200 || statusCode >= 300) {
            if (statusCode === 401) {
                throw new AppError(ErrorCode.TOKEN_EXPIRED, '登录已过期')
            }
            if (statusCode === 403) {
                throw new AppError(ErrorCode.PERMISSION_DENIED, '权限不足')
            }
            throw new AppError(
                ErrorCode.NETWORK_ERROR,
                `请求失败: ${statusCode}`,
                { statusCode }
            )
        }

        // 解析响应数据
        const result = parseResponse<T>(response.data)

        // 检查业务状态码
        if (result.code !== 0 && result.code !== 200) {
            throw new AppError(
                ErrorCode.BUSINESS_ERROR,
                result.message || '业务处理失败',
                { code: result.code }
            )
        }

        return result
    } catch (error) {
        // 隐藏加载提示
        if (showLoading) {
            uni.hideLoading()
        }

        // 清理取消控制器
        if (cancelToken) {
            cancelControllers.delete(cancelToken)
        }

        // 处理错误
        if (error instanceof AppError) {
            if (showError) {
                uni.showToast({ title: error.message, icon: 'none' })
            }
            throw error
        }

        // 网络错误
        const appError = new AppError(
            ErrorCode.NETWORK_ERROR,
            '网络连接失败',
            undefined,
            error as Error
        )
        if (showError) {
            uni.showToast({ title: appError.message, icon: 'none' })
        }
        throw appError
    }
}

/** HTTP服务 */
export const http = {
    /** 发起请求 */
    request,

    /** GET请求 */
    get<T>(
        url: string,
        params?: Record<string, unknown>,
        config?: Partial<RequestConfig>
    ): Promise<ResponseData<T>> {
        return request<T>({
            url,
            method: 'GET',
            params,
            ...config,
        })
    },

    /** POST请求 */
    post<T>(
        url: string,
        data?: Record<string, unknown>,
        config?: Partial<RequestConfig>
    ): Promise<ResponseData<T>> {
        return request<T>({
            url,
            method: 'POST',
            data,
            ...config,
        })
    },

    /** PUT请求 */
    put<T>(
        url: string,
        data?: Record<string, unknown>,
        config?: Partial<RequestConfig>
    ): Promise<ResponseData<T>> {
        return request<T>({
            url,
            method: 'PUT',
            data,
            ...config,
        })
    },

    /** DELETE请求 */
    delete<T>(
        url: string,
        params?: Record<string, unknown>,
        config?: Partial<RequestConfig>
    ): Promise<ResponseData<T>> {
        return request<T>({
            url,
            method: 'DELETE',
            params,
            ...config,
        })
    },

    /** 取消请求 */
    cancel(cancelToken: string): void {
        const controller = cancelControllers.get(cancelToken)
        if (controller) {
            controller.abort()
            cancelControllers.delete(cancelToken)
        }
    },

    /** 取消所有请求 */
    cancelAll(): void {
        cancelControllers.forEach(controller => controller.abort())
        cancelControllers.clear()
    },
}

export default http
