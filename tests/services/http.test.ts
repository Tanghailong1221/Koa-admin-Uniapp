/**
 * HTTP服务属性测试
 * **Feature: mes-wms-mobile-framework, Property 1: HTTP请求令牌自动注入**
 * **Feature: mes-wms-mobile-framework, Property 2: 响应数据解析一致性**
 */
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { addRequestHeaders, parseResponse } from '@/services/http'
import type { RequestConfig, ResponseData } from '@/types/http'

describe('HTTP服务属性测试', () => {
    /**
     * **Feature: mes-wms-mobile-framework, Property 1: HTTP请求令牌自动注入**
     * **验证: 需求 2.1**
     * 
     * 对于任意HTTP请求配置，当用户已登录且令牌有效时，
     * 经过请求拦截器处理后的请求头中应包含Authorization字段，且值为有效的认证令牌
     */
    describe('属性1: HTTP请求令牌自动注入', () => {
        it('当提供有效token时，请求头应包含Authorization字段', () => {
            fc.assert(
                fc.property(
                    // 生成任意URL
                    fc.webUrl(),
                    // 生成任意HTTP方法
                    fc.constantFrom('GET', 'POST', 'PUT', 'DELETE') as fc.Arbitrary<'GET' | 'POST' | 'PUT' | 'DELETE'>,
                    // 生成任意非空token
                    fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
                    (url, method, token) => {
                        const config: RequestConfig = {
                            url,
                            method,
                        }

                        const headers = addRequestHeaders(config, token)

                        // 验证Authorization字段存在且格式正确
                        expect(headers).toHaveProperty('Authorization')
                        expect(headers['Authorization']).toBe(`Bearer ${token}`)
                    }
                ),
                { numRuns: 100 }
            )
        })

        it('当token为空时，请求头不应包含Authorization字段', () => {
            fc.assert(
                fc.property(
                    fc.webUrl(),
                    fc.constantFrom('GET', 'POST', 'PUT', 'DELETE') as fc.Arbitrary<'GET' | 'POST' | 'PUT' | 'DELETE'>,
                    (url, method) => {
                        const config: RequestConfig = {
                            url,
                            method,
                        }

                        const headers = addRequestHeaders(config, '')

                        // 验证Authorization字段不存在
                        expect(headers['Authorization']).toBeUndefined()
                    }
                ),
                { numRuns: 100 }
            )
        })

        it('请求头应始终包含必要的元数据字段', () => {
            fc.assert(
                fc.property(
                    fc.webUrl(),
                    fc.constantFrom('GET', 'POST', 'PUT', 'DELETE') as fc.Arbitrary<'GET' | 'POST' | 'PUT' | 'DELETE'>,
                    fc.string(),
                    (url, method, token) => {
                        const config: RequestConfig = {
                            url,
                            method,
                        }

                        const headers = addRequestHeaders(config, token)

                        // 验证必要字段存在
                        expect(headers).toHaveProperty('Content-Type')
                        expect(headers).toHaveProperty('X-Timestamp')
                        expect(headers).toHaveProperty('X-Signature')
                        expect(headers['Content-Type']).toBe('application/json')
                        // 验证时间戳是有效数字
                        expect(Number(headers['X-Timestamp'])).toBeGreaterThan(0)
                        // 验证签名非空
                        expect(headers['X-Signature'].length).toBeGreaterThan(0)
                    }
                ),
                { numRuns: 100 }
            )
        })
    })

    /**
     * **Feature: mes-wms-mobile-framework, Property 2: 响应数据解析一致性**
     * **验证: 需求 2.2**
     * 
     * 对于任意符合约定格式的API响应JSON字符串，
     * 解析后的对象应包含code、message、data和timestamp字段，且类型与ResponseData接口定义一致
     */
    describe('属性2: 响应数据解析一致性', () => {
        it('标准格式响应应保持原样返回', () => {
            fc.assert(
                fc.property(
                    // 生成标准响应数据
                    fc.record({
                        code: fc.integer({ min: 0, max: 9999 }),
                        message: fc.string(),
                        data: fc.anything(),
                        timestamp: fc.integer({ min: 0 }),
                    }),
                    (response) => {
                        const result = parseResponse(response)

                        // 验证字段存在且值正确
                        expect(result.code).toBe(response.code)
                        expect(result.message).toBe(response.message)
                        expect(result.data).toEqual(response.data)
                        expect(result.timestamp).toBe(response.timestamp)
                    }
                ),
                { numRuns: 100 }
            )
        })

        it('非标准格式响应应被包装为标准格式', () => {
            fc.assert(
                fc.property(
                    // 生成任意非标准数据
                    fc.oneof(
                        fc.string(),
                        fc.integer(),
                        fc.array(fc.anything()),
                        fc.record({ name: fc.string(), value: fc.integer() }),
                    ),
                    (rawData) => {
                        const result = parseResponse(rawData)

                        // 验证包装后的结构
                        expect(result).toHaveProperty('code')
                        expect(result).toHaveProperty('message')
                        expect(result).toHaveProperty('data')
                        expect(result).toHaveProperty('timestamp')

                        // 验证类型
                        expect(typeof result.code).toBe('number')
                        expect(typeof result.message).toBe('string')
                        expect(typeof result.timestamp).toBe('number')

                        // 验证默认值
                        expect(result.code).toBe(0)
                        expect(result.message).toBe('success')
                        expect(result.data).toEqual(rawData)
                        expect(result.timestamp).toBeGreaterThan(0)
                    }
                ),
                { numRuns: 100 }
            )
        })

        it('解析结果应符合ResponseData接口结构', () => {
            fc.assert(
                fc.property(
                    fc.anything(),
                    (data) => {
                        const result = parseResponse<unknown>(data)

                        // 类型检查
                        const isValidResponseData = (obj: unknown): obj is ResponseData<unknown> => {
                            if (typeof obj !== 'object' || obj === null) return false
                            const r = obj as Record<string, unknown>
                            return (
                                typeof r.code === 'number' &&
                                typeof r.message === 'string' &&
                                'data' in r &&
                                typeof r.timestamp === 'number'
                            )
                        }

                        expect(isValidResponseData(result)).toBe(true)
                    }
                ),
                { numRuns: 100 }
            )
        })
    })
})
