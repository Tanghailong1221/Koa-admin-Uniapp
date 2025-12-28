/**
 * HTTP重试机制属性测试
 * **Feature: mes-wms-mobile-framework, Property 3: 请求重试次数限制**
 */
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
    withRetry,
    calculateRetryDelay,
    executeWithRetryCount,
} from '@/services/http/retry'
import { ErrorCode, AppError } from '@/types/error'
import type { ResponseData } from '@/types/http'

describe('HTTP重试机制属性测试', () => {
    /**
     * **Feature: mes-wms-mobile-framework, Property 3: 请求重试次数限制**
     * **验证: 需求 2.3**
     * 
     * 对于任意配置了重试的请求，当持续发生网络错误时，
     * 实际重试次数应等于配置的最大重试次数，不多不少
     */
    describe('属性3: 请求重试次数限制', () => {
        it('重试次数应等于配置的最大重试次数', async () => {
            await fc.assert(
                fc.asyncProperty(
                    // 生成1-5之间的最大重试次数
                    fc.integer({ min: 1, max: 5 }),
                    async (maxRetry) => {
                        let callCount = 0

                        // 创建一个始终失败的请求函数
                        const failingRequest = async (): Promise<ResponseData<unknown>> => {
                            callCount++
                            throw new AppError(ErrorCode.NETWORK_ERROR, '网络错误')
                        }

                        const result = await executeWithRetryCount(failingRequest, {
                            maxRetry,
                            retryDelay: 1, // 使用最小延迟加快测试
                        })

                        // 验证重试次数等于配置的最大值
                        expect(result.success).toBe(false)
                        expect(result.retryCount).toBe(maxRetry)
                        // 总调用次数 = 1次初始请求 + maxRetry次重试
                        expect(callCount).toBe(maxRetry + 1)
                    }
                ),
                { numRuns: 20 } // 减少运行次数因为有异步延迟
            )
        })

        it('成功请求不应触发重试', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.integer({ min: 1, max: 5 }),
                    fc.anything(),
                    async (maxRetry, responseData) => {
                        let callCount = 0

                        // 创建一个始终成功的请求函数
                        const successRequest = async (): Promise<ResponseData<unknown>> => {
                            callCount++
                            return {
                                code: 0,
                                message: 'success',
                                data: responseData,
                                timestamp: Date.now(),
                            }
                        }

                        const result = await executeWithRetryCount(successRequest, {
                            maxRetry,
                            retryDelay: 1,
                        })

                        // 验证成功且没有重试
                        expect(result.success).toBe(true)
                        expect(result.retryCount).toBe(0)
                        expect(callCount).toBe(1)
                    }
                ),
                { numRuns: 20 }
            )
        })

        it('在第N次尝试成功时应停止重试', async () => {
            await fc.assert(
                fc.asyncProperty(
                    // 最大重试次数
                    fc.integer({ min: 2, max: 5 }),
                    // 成功的尝试次数（1表示第一次就成功，2表示第二次成功...）
                    fc.integer({ min: 1, max: 5 }),
                    async (maxRetry, successAttempt) => {
                        // 确保成功尝试在允许范围内
                        const actualSuccessAttempt = Math.min(successAttempt, maxRetry + 1)
                        let callCount = 0

                        const partialFailRequest = async (): Promise<ResponseData<unknown>> => {
                            callCount++
                            if (callCount < actualSuccessAttempt) {
                                throw new AppError(ErrorCode.NETWORK_ERROR, '网络错误')
                            }
                            return {
                                code: 0,
                                message: 'success',
                                data: null,
                                timestamp: Date.now(),
                            }
                        }

                        const result = await executeWithRetryCount(partialFailRequest, {
                            maxRetry,
                            retryDelay: 1,
                        })

                        // 验证在正确的尝试次数后成功
                        expect(result.success).toBe(true)
                        expect(callCount).toBe(actualSuccessAttempt)
                        // 重试次数 = 成功尝试次数 - 1
                        expect(result.retryCount).toBe(actualSuccessAttempt - 1)
                    }
                ),
                { numRuns: 20 }
            )
        })

        it('重试延迟应按指数递增', () => {
            fc.assert(
                fc.property(
                    // 基础延迟
                    fc.integer({ min: 100, max: 1000 }),
                    // 尝试次数
                    fc.integer({ min: 1, max: 5 }),
                    (baseDelay, attempt) => {
                        const delay = calculateRetryDelay(attempt, baseDelay)
                        const expectedDelay = baseDelay * Math.pow(2, attempt - 1)

                        expect(delay).toBe(expectedDelay)
                    }
                ),
                { numRuns: 100 }
            )
        })

        it('非网络错误不应触发重试', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.integer({ min: 1, max: 5 }),
                    async (maxRetry) => {
                        let callCount = 0

                        // 创建一个抛出业务错误的请求函数
                        const businessErrorRequest = async (): Promise<ResponseData<unknown>> => {
                            callCount++
                            throw new AppError(ErrorCode.BUSINESS_ERROR, '业务错误')
                        }

                        const result = await executeWithRetryCount(businessErrorRequest, {
                            maxRetry,
                            retryDelay: 1,
                            shouldRetry: (error) => {
                                // 只对网络错误重试
                                if (error instanceof AppError) {
                                    return error.code === ErrorCode.NETWORK_ERROR
                                }
                                return false
                            },
                        })

                        // 验证没有重试（因为是业务错误）
                        expect(result.success).toBe(false)
                        expect(callCount).toBe(1)
                    }
                ),
                { numRuns: 20 }
            )
        })
    })
})
