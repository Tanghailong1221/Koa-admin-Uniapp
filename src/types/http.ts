/**
 * HTTP服务相关类型定义
 */

/** HTTP请求方法 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

/** 请求配置 */
export interface RequestConfig {
    /** 请求URL */
    url: string
    /** 请求方法 */
    method: HttpMethod
    /** 请求数据 */
    data?: Record<string, unknown>
    /** 请求参数 */
    params?: Record<string, unknown>
    /** 请求头 */
    headers?: Record<string, string>
    /** 超时时间（毫秒） */
    timeout?: number
    /** 重试次数 */
    retry?: number
    /** 重试间隔（毫秒） */
    retryDelay?: number
    /** 取消令牌 */
    cancelToken?: string
    /** 是否显示加载提示 */
    showLoading?: boolean
    /** 是否显示错误提示 */
    showError?: boolean
}

/** 响应数据结构 */
export interface ResponseData<T = unknown> {
    /** 业务状态码 */
    code: number
    /** 响应消息 */
    message: string
    /** 响应数据 */
    data: T
    /** 时间戳 */
    timestamp: number
}

/** 请求拦截器 */
export interface RequestInterceptor {
    /** 请求前处理 */
    onRequest?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>
    /** 请求错误处理 */
    onRequestError?: (error: Error) => void
}

/** 响应拦截器 */
export interface ResponseInterceptor {
    /** 响应成功处理 */
    onResponse?: <T>(response: ResponseData<T>) => ResponseData<T> | Promise<ResponseData<T>>
    /** 响应错误处理 */
    onResponseError?: (error: Error) => void
}

/** HTTP服务接口 */
export interface HttpService {
    /** 发起请求 */
    request<T>(config: RequestConfig): Promise<ResponseData<T>>
    /** GET请求 */
    get<T>(url: string, params?: Record<string, unknown>, config?: Partial<RequestConfig>): Promise<ResponseData<T>>
    /** POST请求 */
    post<T>(url: string, data?: Record<string, unknown>, config?: Partial<RequestConfig>): Promise<ResponseData<T>>
    /** PUT请求 */
    put<T>(url: string, data?: Record<string, unknown>, config?: Partial<RequestConfig>): Promise<ResponseData<T>>
    /** DELETE请求 */
    delete<T>(url: string, params?: Record<string, unknown>, config?: Partial<RequestConfig>): Promise<ResponseData<T>>
    /** 取消请求 */
    cancel(cancelToken: string): void
    /** 取消所有请求 */
    cancelAll(): void
}

/** 请求队列项 */
export interface RequestQueueItem {
    /** 请求配置 */
    config: RequestConfig
    /** 解析函数 */
    resolve: (value: unknown) => void
    /** 拒绝函数 */
    reject: (reason?: unknown) => void
}
