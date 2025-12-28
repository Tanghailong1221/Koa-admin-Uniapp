/**
 * 工序报工组合式函数
 * 实现工序选择、数量录入、质量检验流程
 */
import { ref, computed, reactive } from 'vue'
import type { WorkOrder, Process, WorkReport } from '@/types/business'

/** 报工表单数据 */
export interface WorkReportForm {
    /** 工单ID */
    workOrderId: string
    /** 工序ID */
    processId: string
    /** 报工数量 */
    quantity: number
    /** 合格数量 */
    qualifiedQty: number
    /** 不合格数量 */
    unqualifiedQty: number
    /** 设备ID */
    equipmentId?: string
    /** 备注 */
    remark?: string
}

/** 质检项 */
export interface QualityCheckItem {
    /** 检验项ID */
    id: string
    /** 检验项名称 */
    name: string
    /** 标准值 */
    standardValue: string
    /** 实际值 */
    actualValue: string
    /** 是否合格 */
    passed: boolean
    /** 是否必检 */
    required: boolean
}

/** 报工状态 */
export type ReportStatus = 'idle' | 'selecting' | 'inputting' | 'checking' | 'submitting' | 'success' | 'error'

/** useWorkReport 配置选项 */
export interface UseWorkReportOptions {
    /** 提交报工回调 */
    onSubmit?: (report: WorkReportForm) => Promise<boolean>
    /** 加载工单回调 */
    onLoadWorkOrder?: (workOrderId: string) => Promise<WorkOrder | null>
    /** 加载工序列表回调 */
    onLoadProcesses?: (workOrderId: string) => Promise<Process[]>
    /** 加载质检项回调 */
    onLoadQualityItems?: (processId: string) => Promise<QualityCheckItem[]>
}

/**
 * 工序报工组合式函数
 */
export function useWorkReport(options: UseWorkReportOptions = {}) {
    const { onSubmit, onLoadWorkOrder, onLoadProcesses, onLoadQualityItems } = options

    // 当前状态
    const status = ref<ReportStatus>('idle')

    // 当前工单
    const currentWorkOrder = ref<WorkOrder | null>(null)

    // 工序列表
    const processes = ref<Process[]>([])

    // 当前选中的工序
    const currentProcess = ref<Process | null>(null)

    // 质检项列表
    const qualityItems = ref<QualityCheckItem[]>([])

    // 报工表单
    const reportForm = reactive<WorkReportForm>({
        workOrderId: '',
        processId: '',
        quantity: 0,
        qualifiedQty: 0,
        unqualifiedQty: 0,
        equipmentId: '',
        remark: '',
    })

    // 错误信息
    const errorMessage = ref<string | null>(null)

    // 报工历史
    const reportHistory = ref<WorkReport[]>([])

    // 计算属性：是否可以提交
    const canSubmit = computed(() => {
        if (!reportForm.workOrderId || !reportForm.processId) {
            return false
        }
        if (reportForm.quantity <= 0) {
            return false
        }
        if (reportForm.qualifiedQty + reportForm.unqualifiedQty !== reportForm.quantity) {
            return false
        }
        // 检查必检项是否都已填写
        const requiredItems = qualityItems.value.filter((item) => item.required)
        const allRequiredFilled = requiredItems.every((item) => item.actualValue !== '')
        return allRequiredFilled
    })

    // 计算属性：合格率
    const qualifiedRate = computed(() => {
        if (reportForm.quantity === 0) {
            return 0
        }
        return Math.round((reportForm.qualifiedQty / reportForm.quantity) * 100)
    })

    // 计算属性：工单完成进度
    const workOrderProgress = computed(() => {
        if (!currentWorkOrder.value) {
            return 0
        }
        const { planQty, completedQty } = currentWorkOrder.value
        if (planQty === 0) {
            return 0
        }
        return Math.round((completedQty / planQty) * 100)
    })

    /**
     * 选择工单
     */
    const selectWorkOrder = async (workOrderId: string): Promise<boolean> => {
        status.value = 'selecting'
        errorMessage.value = null

        try {
            // 加载工单信息
            if (onLoadWorkOrder) {
                currentWorkOrder.value = await onLoadWorkOrder(workOrderId)
            } else {
                // 模拟数据
                currentWorkOrder.value = {
                    id: workOrderId,
                    orderNo: `WO${workOrderId}`,
                    productCode: 'P001',
                    productName: '测试产品',
                    planQty: 100,
                    completedQty: 0,
                    status: 'processing',
                    priority: 1,
                    planStartTime: new Date().toISOString(),
                    planEndTime: new Date().toISOString(),
                }
            }

            if (!currentWorkOrder.value) {
                throw new Error('工单不存在')
            }

            // 加载工序列表
            if (onLoadProcesses) {
                processes.value = await onLoadProcesses(workOrderId)
            } else {
                // 模拟数据
                processes.value = [
                    { id: '1', code: 'OP10', name: '下料', sequence: 1 },
                    { id: '2', code: 'OP20', name: '加工', sequence: 2 },
                    { id: '3', code: 'OP30', name: '检验', sequence: 3, isQcProcess: true },
                ]
            }

            // 更新表单
            reportForm.workOrderId = workOrderId
            status.value = 'inputting'
            return true
        } catch (e) {
            errorMessage.value = e instanceof Error ? e.message : '加载工单失败'
            status.value = 'error'
            return false
        }
    }

    /**
     * 选择工序
     */
    const selectProcess = async (processId: string): Promise<boolean> => {
        const process = processes.value.find((p) => p.id === processId)
        if (!process) {
            errorMessage.value = '工序不存在'
            return false
        }

        currentProcess.value = process
        reportForm.processId = processId

        // 如果是质检工序，加载质检项
        if (process.isQcProcess) {
            status.value = 'checking'
            if (onLoadQualityItems) {
                qualityItems.value = await onLoadQualityItems(processId)
            } else {
                // 模拟数据
                qualityItems.value = [
                    {
                        id: '1',
                        name: '外观检查',
                        standardValue: '无划痕',
                        actualValue: '',
                        passed: false,
                        required: true,
                    },
                    {
                        id: '2',
                        name: '尺寸检查',
                        standardValue: '10±0.1mm',
                        actualValue: '',
                        passed: false,
                        required: true,
                    },
                ]
            }
        } else {
            qualityItems.value = []
        }

        return true
    }

    /**
     * 更新报工数量
     */
    const updateQuantity = (quantity: number, qualifiedQty?: number) => {
        reportForm.quantity = Math.max(0, quantity)
        if (qualifiedQty !== undefined) {
            reportForm.qualifiedQty = Math.max(0, Math.min(qualifiedQty, quantity))
            reportForm.unqualifiedQty = quantity - reportForm.qualifiedQty
        } else {
            // 默认全部合格
            reportForm.qualifiedQty = quantity
            reportForm.unqualifiedQty = 0
        }
    }

    /**
     * 更新质检项
     */
    const updateQualityItem = (itemId: string, actualValue: string, passed: boolean) => {
        const item = qualityItems.value.find((i) => i.id === itemId)
        if (item) {
            item.actualValue = actualValue
            item.passed = passed
        }
    }

    /**
     * 提交报工
     */
    const submitReport = async (): Promise<boolean> => {
        if (!canSubmit.value) {
            errorMessage.value = '请完善报工信息'
            return false
        }

        status.value = 'submitting'
        errorMessage.value = null

        try {
            let success = true
            if (onSubmit) {
                success = await onSubmit(reportForm)
            }

            if (success) {
                // 添加到历史记录
                const report: WorkReport = {
                    id: `R${Date.now()}`,
                    workOrderId: reportForm.workOrderId,
                    processId: reportForm.processId,
                    quantity: reportForm.quantity,
                    qualifiedQty: reportForm.qualifiedQty,
                    unqualifiedQty: reportForm.unqualifiedQty,
                    operatorId: 'current_user',
                    operatorName: '当前用户',
                    equipmentId: reportForm.equipmentId,
                    reportTime: new Date().toISOString(),
                    remark: reportForm.remark,
                }
                reportHistory.value.unshift(report)

                // 更新工单完成数量
                if (currentWorkOrder.value) {
                    currentWorkOrder.value.completedQty += reportForm.qualifiedQty
                }

                status.value = 'success'
                return true
            } else {
                throw new Error('提交失败')
            }
        } catch (e) {
            errorMessage.value = e instanceof Error ? e.message : '提交报工失败'
            status.value = 'error'
            return false
        }
    }

    /**
     * 重置表单
     */
    const resetForm = () => {
        reportForm.workOrderId = ''
        reportForm.processId = ''
        reportForm.quantity = 0
        reportForm.qualifiedQty = 0
        reportForm.unqualifiedQty = 0
        reportForm.equipmentId = ''
        reportForm.remark = ''
        currentWorkOrder.value = null
        currentProcess.value = null
        processes.value = []
        qualityItems.value = []
        status.value = 'idle'
        errorMessage.value = null
    }

    return {
        // 状态
        status,
        currentWorkOrder,
        processes,
        currentProcess,
        qualityItems,
        reportForm,
        errorMessage,
        reportHistory,

        // 计算属性
        canSubmit,
        qualifiedRate,
        workOrderProgress,

        // 方法
        selectWorkOrder,
        selectProcess,
        updateQuantity,
        updateQualityItem,
        submitReport,
        resetForm,
    }
}
