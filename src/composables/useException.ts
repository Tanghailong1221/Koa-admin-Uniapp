/**
 * 异常处理组合式函数
 * 实现异常上报、处理、跟踪流程
 */
import { ref, computed, reactive } from 'vue'
import type { ExceptionRecord, ExceptionType, ExceptionStatus } from '@/types/business'

/** 异常上报表单 */
export interface ExceptionReportForm {
    /** 异常类型 */
    type: ExceptionType
    /** 异常描述 */
    description: string
    /** 关联工单 */
    workOrderId?: string
    /** 关联设备 */
    equipmentId?: string
    /** 附件列表 */
    attachments: string[]
}

/** 异常处理表单 */
export interface ExceptionHandleForm {
    /** 异常ID */
    exceptionId: string
    /** 处理结果 */
    handleResult: string
    /** 附件列表 */
    attachments: string[]
}

/** 异常统计 */
export interface ExceptionStats {
    /** 总数 */
    total: number
    /** 待处理 */
    pending: number
    /** 处理中 */
    processing: number
    /** 已解决 */
    resolved: number
    /** 已关闭 */
    closed: number
    /** 按类型统计 */
    byType: Record<ExceptionType, number>
}

/** useException 配置选项 */
export interface UseExceptionOptions {
    /** 上报异常回调 */
    onReport?: (form: ExceptionReportForm) => Promise<ExceptionRecord | null>
    /** 处理异常回调 */
    onHandle?: (form: ExceptionHandleForm) => Promise<boolean>
    /** 加载异常列表回调 */
    onLoadExceptions?: (filters?: ExceptionFilters) => Promise<ExceptionRecord[]>
    /** 加载异常详情回调 */
    onLoadExceptionDetail?: (exceptionId: string) => Promise<ExceptionRecord | null>
    /** 上传附件回调 */
    onUploadAttachment?: (file: File) => Promise<string | null>
}

/** 异常筛选条件 */
export interface ExceptionFilters {
    /** 异常类型 */
    type?: ExceptionType
    /** 异常状态 */
    status?: ExceptionStatus
    /** 开始时间 */
    startTime?: string
    /** 结束时间 */
    endTime?: string
    /** 关键词 */
    keyword?: string
}

/**
 * 异常处理组合式函数
 */
export function useException(options: UseExceptionOptions = {}) {
    const { onReport, onHandle, onLoadExceptions, onLoadExceptionDetail, onUploadAttachment } = options

    // 异常列表
    const exceptions = ref<ExceptionRecord[]>([])

    // 当前异常详情
    const currentException = ref<ExceptionRecord | null>(null)

    // 上报表单
    const reportForm = reactive<ExceptionReportForm>({
        type: 'other',
        description: '',
        workOrderId: '',
        equipmentId: '',
        attachments: [],
    })

    // 处理表单
    const handleForm = reactive<ExceptionHandleForm>({
        exceptionId: '',
        handleResult: '',
        attachments: [],
    })

    // 筛选条件
    const filters = reactive<ExceptionFilters>({})

    // 加载状态
    const loading = ref(false)

    // 提交状态
    const submitting = ref(false)

    // 错误信息
    const errorMessage = ref<string | null>(null)

    // 计算属性：异常统计
    const stats = computed<ExceptionStats>(() => {
        const list = exceptions.value
        const byType: Record<ExceptionType, number> = {
            quality: 0,
            equipment: 0,
            material: 0,
            process: 0,
            other: 0,
        }

        list.forEach((e) => {
            byType[e.type]++
        })

        return {
            total: list.length,
            pending: list.filter((e) => e.status === 'pending').length,
            processing: list.filter((e) => e.status === 'processing').length,
            resolved: list.filter((e) => e.status === 'resolved').length,
            closed: list.filter((e) => e.status === 'closed').length,
            byType,
        }
    })

    // 计算属性：待处理异常
    const pendingExceptions = computed(() => {
        return exceptions.value.filter((e) => e.status === 'pending')
    })

    // 计算属性：我的异常（上报的或处理的）
    const myExceptions = computed(() => {
        const currentUser = 'current_user' // 实际应从用户状态获取
        return exceptions.value.filter((e) => e.reporter === currentUser || e.handler === currentUser)
    })

    /**
     * 加载异常列表
     */
    const loadExceptions = async (customFilters?: ExceptionFilters): Promise<boolean> => {
        loading.value = true
        errorMessage.value = null

        try {
            const queryFilters = customFilters || filters

            if (onLoadExceptions) {
                exceptions.value = await onLoadExceptions(queryFilters)
            } else {
                // 模拟数据
                exceptions.value = [
                    {
                        id: '1',
                        exceptionNo: 'EX20231201001',
                        type: 'quality',
                        status: 'pending',
                        description: '产品外观不良',
                        workOrderId: 'WO001',
                        reporter: 'user1',
                        reportTime: new Date().toISOString(),
                    },
                    {
                        id: '2',
                        exceptionNo: 'EX20231201002',
                        type: 'equipment',
                        status: 'processing',
                        description: '设备异常停机',
                        equipmentId: 'EQ001',
                        reporter: 'user2',
                        reportTime: new Date(Date.now() - 3600000).toISOString(),
                        handler: 'user3',
                        handleTime: new Date().toISOString(),
                    },
                ]
            }

            loading.value = false
            return true
        } catch (e) {
            errorMessage.value = e instanceof Error ? e.message : '加载异常列表失败'
            loading.value = false
            return false
        }
    }

    /**
     * 加载异常详情
     */
    const loadExceptionDetail = async (exceptionId: string): Promise<ExceptionRecord | null> => {
        loading.value = true
        errorMessage.value = null

        try {
            let exception: ExceptionRecord | null = null

            if (onLoadExceptionDetail) {
                exception = await onLoadExceptionDetail(exceptionId)
            } else {
                // 从列表中查找
                exception = exceptions.value.find((e) => e.id === exceptionId) || null
            }

            if (exception) {
                currentException.value = exception
            }

            loading.value = false
            return exception
        } catch (e) {
            errorMessage.value = e instanceof Error ? e.message : '加载异常详情失败'
            loading.value = false
            return null
        }
    }

    /**
     * 上报异常
     */
    const reportException = async (): Promise<ExceptionRecord | null> => {
        if (!reportForm.description.trim()) {
            errorMessage.value = '请填写异常描述'
            return null
        }

        submitting.value = true
        errorMessage.value = null

        try {
            let exception: ExceptionRecord | null = null

            if (onReport) {
                exception = await onReport(reportForm)
            } else {
                // 模拟创建
                exception = {
                    id: `E${Date.now()}`,
                    exceptionNo: `EX${Date.now()}`,
                    type: reportForm.type,
                    status: 'pending',
                    description: reportForm.description,
                    workOrderId: reportForm.workOrderId || undefined,
                    equipmentId: reportForm.equipmentId || undefined,
                    reporter: 'current_user',
                    reportTime: new Date().toISOString(),
                    attachments: reportForm.attachments,
                }
            }

            if (exception) {
                exceptions.value.unshift(exception)
                resetReportForm()
            }

            submitting.value = false
            return exception
        } catch (e) {
            errorMessage.value = e instanceof Error ? e.message : '上报异常失败'
            submitting.value = false
            return null
        }
    }

    /**
     * 处理异常
     */
    const handleException = async (): Promise<boolean> => {
        if (!handleForm.exceptionId) {
            errorMessage.value = '请选择要处理的异常'
            return false
        }

        if (!handleForm.handleResult.trim()) {
            errorMessage.value = '请填写处理结果'
            return false
        }

        submitting.value = true
        errorMessage.value = null

        try {
            let success = true

            if (onHandle) {
                success = await onHandle(handleForm)
            }

            if (success) {
                // 更新本地状态
                const exception = exceptions.value.find((e) => e.id === handleForm.exceptionId)
                if (exception) {
                    exception.status = 'resolved'
                    exception.handler = 'current_user'
                    exception.handleTime = new Date().toISOString()
                    exception.handleResult = handleForm.handleResult
                }

                resetHandleForm()
            }

            submitting.value = false
            return success
        } catch (e) {
            errorMessage.value = e instanceof Error ? e.message : '处理异常失败'
            submitting.value = false
            return false
        }
    }

    /**
     * 上传附件
     */
    const uploadAttachment = async (file: File, target: 'report' | 'handle'): Promise<string | null> => {
        try {
            let url: string | null = null

            if (onUploadAttachment) {
                url = await onUploadAttachment(file)
            } else {
                // 模拟上传
                url = URL.createObjectURL(file)
            }

            if (url) {
                if (target === 'report') {
                    reportForm.attachments.push(url)
                } else {
                    handleForm.attachments.push(url)
                }
            }

            return url
        } catch (e) {
            errorMessage.value = e instanceof Error ? e.message : '上传附件失败'
            return null
        }
    }

    /**
     * 移除附件
     */
    const removeAttachment = (url: string, target: 'report' | 'handle') => {
        if (target === 'report') {
            reportForm.attachments = reportForm.attachments.filter((a) => a !== url)
        } else {
            handleForm.attachments = handleForm.attachments.filter((a) => a !== url)
        }
    }

    /**
     * 设置筛选条件
     */
    const setFilters = (newFilters: Partial<ExceptionFilters>) => {
        Object.assign(filters, newFilters)
    }

    /**
     * 清空筛选条件
     */
    const clearFilters = () => {
        filters.type = undefined
        filters.status = undefined
        filters.startTime = undefined
        filters.endTime = undefined
        filters.keyword = undefined
    }

    /**
     * 重置上报表单
     */
    const resetReportForm = () => {
        reportForm.type = 'other'
        reportForm.description = ''
        reportForm.workOrderId = ''
        reportForm.equipmentId = ''
        reportForm.attachments = []
    }

    /**
     * 重置处理表单
     */
    const resetHandleForm = () => {
        handleForm.exceptionId = ''
        handleForm.handleResult = ''
        handleForm.attachments = []
    }

    /**
     * 开始处理异常
     */
    const startHandle = (exceptionId: string) => {
        handleForm.exceptionId = exceptionId

        // 更新状态为处理中
        const exception = exceptions.value.find((e) => e.id === exceptionId)
        if (exception && exception.status === 'pending') {
            exception.status = 'processing'
            exception.handler = 'current_user'
            exception.handleTime = new Date().toISOString()
        }
    }

    /**
     * 关闭异常
     */
    const closeException = (exceptionId: string) => {
        const exception = exceptions.value.find((e) => e.id === exceptionId)
        if (exception && exception.status === 'resolved') {
            exception.status = 'closed'
        }
    }

    return {
        // 状态
        exceptions,
        currentException,
        reportForm,
        handleForm,
        filters,
        loading,
        submitting,
        errorMessage,

        // 计算属性
        stats,
        pendingExceptions,
        myExceptions,

        // 方法
        loadExceptions,
        loadExceptionDetail,
        reportException,
        handleException,
        uploadAttachment,
        removeAttachment,
        setFilters,
        clearFilters,
        resetReportForm,
        resetHandleForm,
        startHandle,
        closeException,
    }
}
