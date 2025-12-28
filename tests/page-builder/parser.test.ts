/**
 * 页面配置解析器属性测试
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
    validatePageConfig,
    validateComponentConfig,
    parsePageConfig,
    isComponentTypeSupported,
    SUPPORTED_COMPONENT_TYPES,
    getDataBindings,
} from '../../src/page-builder/parser'
import type { PageConfig, ComponentConfig } from '../../src/types'

/**
 * 生成有效的组件配置
 */
const validComponentConfigArb = fc.record({
    id: fc.string({ minLength: 1, maxLength: 20 }).map((s) => `comp_${s.replace(/[^a-zA-Z0-9]/g, '')}`),
    type: fc.constantFrom(...SUPPORTED_COMPONENT_TYPES),
    props: fc.dictionary(
        fc.string({ minLength: 1, maxLength: 10 }).map((s) => s.replace(/[^a-zA-Z]/g, 'a')),
        fc.oneof(fc.string(), fc.integer(), fc.boolean())
    ),
})

/**
 * 生成有效的页面配置
 */
const validPageConfigArb = fc.record({
    pageCode: fc.string({ minLength: 1, maxLength: 20 }).map((s) => `page_${s.replace(/[^a-zA-Z0-9]/g, '')}`),
    title: fc.string({ minLength: 1, maxLength: 50 }),
    components: fc.array(validComponentConfigArb, { minLength: 1, maxLength: 5 }),
})

describe('页面配置解析器属性测试', () => {
    /**
     * 属性7: 页面配置解析完整性
     * 验证: 需求 5.1 - 有效配置应能正确解析
     */
    describe('属性7: 页面配置解析完整性', () => {
        it('有效的页面配置应通过验证', () => {
            fc.assert(
                fc.property(validPageConfigArb, (config) => {
                    const result = validatePageConfig(config)
                    expect(result.valid).toBe(true)
                    expect(result.errors.length).toBe(0)
                }),
                { numRuns: 50 }
            )
        })

        it('解析后的页面应保留所有组件', () => {
            fc.assert(
                fc.property(validPageConfigArb, (config) => {
                    const parsed = parsePageConfig(config as PageConfig)

                    expect(parsed.pageCode).toBe(config.pageCode)
                    expect(parsed.title).toBe(config.title)
                    expect(parsed.components.length).toBe(config.components.length)

                    // 验证每个组件都被正确解析
                    config.components.forEach((comp, index) => {
                        expect(parsed.components[index].id).toBe(comp.id)
                        expect(parsed.components[index].type).toBe(comp.type)
                    })
                }),
                { numRuns: 50 }
            )
        })

        it('解析后的组件应默认可见', () => {
            fc.assert(
                fc.property(validPageConfigArb, (config) => {
                    const parsed = parsePageConfig(config as PageConfig)

                    parsed.components.forEach((comp) => {
                        expect(comp.visible).toBe(true)
                    })
                }),
                { numRuns: 30 }
            )
        })
    })

    /**
     * 配置验证测试
     */
    describe('配置验证', () => {
        it('缺少pageCode应验证失败', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 50 }),
                    fc.array(validComponentConfigArb, { minLength: 1, maxLength: 3 }),
                    (title, components) => {
                        const config = { title, components }
                        const result = validatePageConfig(config)

                        expect(result.valid).toBe(false)
                        expect(result.errors.some((e) => e.path === 'pageCode')).toBe(true)
                    }
                ),
                { numRuns: 20 }
            )
        })

        it('缺少title应验证失败', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 20 }),
                    fc.array(validComponentConfigArb, { minLength: 1, maxLength: 3 }),
                    (pageCode, components) => {
                        const config = { pageCode, components }
                        const result = validatePageConfig(config)

                        expect(result.valid).toBe(false)
                        expect(result.errors.some((e) => e.path === 'title')).toBe(true)
                    }
                ),
                { numRuns: 20 }
            )
        })

        it('空组件数组应验证失败', () => {
            const config = {
                pageCode: 'test',
                title: 'Test Page',
                components: 'not-an-array',
            }
            const result = validatePageConfig(config)

            expect(result.valid).toBe(false)
            expect(result.errors.some((e) => e.path === 'components')).toBe(true)
        })
    })

    /**
     * 组件验证测试
     */
    describe('组件验证', () => {
        it('有效组件配置应通过验证', () => {
            fc.assert(
                fc.property(validComponentConfigArb, (config) => {
                    const errors = validateComponentConfig(config, 'test')
                    expect(errors.length).toBe(0)
                }),
                { numRuns: 50 }
            )
        })

        it('缺少组件ID应验证失败', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom(...SUPPORTED_COMPONENT_TYPES),
                    (type) => {
                        const config = { type, props: {} }
                        const errors = validateComponentConfig(config, 'test')

                        expect(errors.some((e) => e.path === 'test.id')).toBe(true)
                    }
                ),
                { numRuns: 20 }
            )
        })

        it('不支持的组件类型应验证失败', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 20 }),
                    fc.string({ minLength: 1, maxLength: 20 }).filter(
                        (t) => !SUPPORTED_COMPONENT_TYPES.includes(t as typeof SUPPORTED_COMPONENT_TYPES[number])
                    ),
                    (id, type) => {
                        const config = { id, type, props: {} }
                        const errors = validateComponentConfig(config, 'test')

                        expect(errors.some((e) => e.code === 'UNSUPPORTED_TYPE')).toBe(true)
                    }
                ),
                { numRuns: 20 }
            )
        })
    })

    /**
     * 组件类型支持测试
     */
    describe('组件类型支持', () => {
        it('所有预定义组件类型应被支持', () => {
            SUPPORTED_COMPONENT_TYPES.forEach((type) => {
                expect(isComponentTypeSupported(type)).toBe(true)
            })
        })

        it('随机字符串通常不被支持', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 20 }).filter(
                        (s) => !SUPPORTED_COMPONENT_TYPES.includes(s as typeof SUPPORTED_COMPONENT_TYPES[number])
                    ),
                    (type) => {
                        expect(isComponentTypeSupported(type)).toBe(false)
                    }
                ),
                { numRuns: 30 }
            )
        })
    })

    /**
     * 权限过滤测试
     */
    describe('权限过滤', () => {
        it('有权限的组件应可见', () => {
            const config: PageConfig = {
                pageCode: 'test',
                title: 'Test',
                components: [
                    { id: 'comp1', type: 'MButton', props: {}, permission: 'view' },
                    { id: 'comp2', type: 'MInput', props: {}, permission: 'edit' },
                ],
            }

            const parsed = parsePageConfig(config, ['view', 'edit'])

            expect(parsed.components[0].visible).toBe(true)
            expect(parsed.components[1].visible).toBe(true)
        })

        it('无权限的组件应不可见', () => {
            const config: PageConfig = {
                pageCode: 'test',
                title: 'Test',
                components: [
                    { id: 'comp1', type: 'MButton', props: {}, permission: 'admin' },
                ],
            }

            const parsed = parsePageConfig(config, ['view'])

            expect(parsed.components[0].visible).toBe(false)
        })

        it('无权限要求的组件应可见', () => {
            const config: PageConfig = {
                pageCode: 'test',
                title: 'Test',
                components: [{ id: 'comp1', type: 'MButton', props: {} }],
            }

            const parsed = parsePageConfig(config, [])

            expect(parsed.components[0].visible).toBe(true)
        })
    })

    /**
     * 数据绑定测试
     */
    describe('数据绑定', () => {
        it('应正确收集数据绑定', () => {
            const config: PageConfig = {
                pageCode: 'test',
                title: 'Test',
                components: [
                    {
                        id: 'comp1',
                        type: 'MInput',
                        props: {},
                        dataBinding: { source: 'form', field: 'name' },
                    },
                    {
                        id: 'comp2',
                        type: 'MInput',
                        props: {},
                        dataBinding: { source: 'form', field: 'age' },
                    },
                    {
                        id: 'comp3',
                        type: 'MText',
                        props: {},
                        dataBinding: { source: 'list', field: 'items' },
                    },
                ],
            }

            const bindings = getDataBindings(config)

            expect(bindings.get('form')).toEqual(['name', 'age'])
            expect(bindings.get('list')).toEqual(['items'])
        })
    })

    /**
     * 嵌套组件测试
     */
    describe('嵌套组件', () => {
        it('应正确解析嵌套组件', () => {
            const config: PageConfig = {
                pageCode: 'test',
                title: 'Test',
                components: [
                    {
                        id: 'container',
                        type: 'MContainer',
                        props: {},
                        children: [
                            { id: 'child1', type: 'MButton', props: {} },
                            { id: 'child2', type: 'MInput', props: {} },
                        ],
                    },
                ],
            }

            const parsed = parsePageConfig(config)

            expect(parsed.components.length).toBe(1)
            expect(parsed.components[0].children?.length).toBe(2)
            expect(parsed.components[0].children?.[0].id).toBe('child1')
            expect(parsed.components[0].children?.[1].id).toBe('child2')
        })

        it('嵌套组件的权限应正确过滤', () => {
            const config: PageConfig = {
                pageCode: 'test',
                title: 'Test',
                components: [
                    {
                        id: 'container',
                        type: 'MContainer',
                        props: {},
                        children: [
                            { id: 'child1', type: 'MButton', props: {}, permission: 'admin' },
                            { id: 'child2', type: 'MInput', props: {} },
                        ],
                    },
                ],
            }

            const parsed = parsePageConfig(config, ['view'])

            expect(parsed.components[0].children?.[0].visible).toBe(false)
            expect(parsed.components[0].children?.[1].visible).toBe(true)
        })
    })

    /**
     * 数据源测试
     */
    describe('数据源', () => {
        it('静态数据源应被初始化', () => {
            const config: PageConfig = {
                pageCode: 'test',
                title: 'Test',
                components: [{ id: 'comp1', type: 'MList', props: {} }],
                dataSource: [
                    {
                        id: 'staticData',
                        type: 'static',
                        config: { data: [1, 2, 3] },
                    },
                ],
            }

            const parsed = parsePageConfig(config)

            expect(parsed.dataSources.get('staticData')).toEqual([1, 2, 3])
        })

        it('API数据源应初始化为null', () => {
            const config: PageConfig = {
                pageCode: 'test',
                title: 'Test',
                components: [{ id: 'comp1', type: 'MList', props: {} }],
                dataSource: [
                    {
                        id: 'apiData',
                        type: 'api',
                        config: { url: '/api/data', method: 'GET' },
                    },
                ],
            }

            const parsed = parsePageConfig(config)

            expect(parsed.dataSources.get('apiData')).toBeNull()
        })
    })
})
