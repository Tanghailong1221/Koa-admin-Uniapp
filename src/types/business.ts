/**
 * 业务数据模型类型定义
 */

/** 工单状态 */
export type WorkOrderStatus = 'pending' | 'processing' | 'completed' | 'closed' | 'cancelled'

/** 工单 */
export interface WorkOrder {
    /** 工单ID */
    id: string
    /** 工单号 */
    orderNo: string
    /** 产品编码 */
    productCode: string
    /** 产品名称 */
    productName: string
    /** 计划数量 */
    planQty: number
    /** 完成数量 */
    completedQty: number
    /** 合格数量 */
    qualifiedQty?: number
    /** 不合格数量 */
    unqualifiedQty?: number
    /** 工单状态 */
    status: WorkOrderStatus
    /** 优先级 */
    priority: number
    /** 计划开始时间 */
    planStartTime: string
    /** 计划结束时间 */
    planEndTime: string
    /** 实际开始时间 */
    actualStartTime?: string
    /** 实际结束时间 */
    actualEndTime?: string
    /** 当前工序 */
    currentProcess?: string
    /** 备注 */
    remark?: string
}

/** 工序 */
export interface Process {
    /** 工序ID */
    id: string
    /** 工序编码 */
    code: string
    /** 工序名称 */
    name: string
    /** 工序顺序 */
    sequence: number
    /** 标准工时（分钟） */
    standardTime?: number
    /** 工作中心 */
    workCenter?: string
    /** 是否质检工序 */
    isQcProcess?: boolean
}

/** 报工记录 */
export interface WorkReport {
    /** 记录ID */
    id: string
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
    /** 操作员ID */
    operatorId: string
    /** 操作员姓名 */
    operatorName: string
    /** 设备ID */
    equipmentId?: string
    /** 报工时间 */
    reportTime: string
    /** 备注 */
    remark?: string
}

/** 库存项 */
export interface InventoryItem {
    /** 库存ID */
    id: string
    /** 物料编码 */
    materialCode: string
    /** 物料名称 */
    materialName: string
    /** 库位编码 */
    locationCode: string
    /** 库位名称 */
    locationName: string
    /** 数量 */
    quantity: number
    /** 单位 */
    unit: string
    /** 批次号 */
    batchNo?: string
    /** 序列号 */
    serialNo?: string
    /** 生产日期 */
    productionDate?: string
    /** 过期日期 */
    expiryDate?: string
    /** 质量状态 */
    qualityStatus?: 'qualified' | 'unqualified' | 'pending'
}

/** 库位 */
export interface Location {
    /** 库位ID */
    id: string
    /** 库位编码 */
    code: string
    /** 库位名称 */
    name: string
    /** 仓库ID */
    warehouseId: string
    /** 仓库名称 */
    warehouseName: string
    /** 库区ID */
    areaId?: string
    /** 库区名称 */
    areaName?: string
    /** 父级库位ID */
    parentId?: string
    /** 子库位 */
    children?: Location[]
    /** 库位类型 */
    type?: 'storage' | 'picking' | 'staging' | 'shipping'
    /** 是否启用 */
    enabled: boolean
}

/** 库存操作类型 */
export type InventoryOperationType = 'inbound' | 'outbound' | 'transfer' | 'stocktake' | 'adjust'

/** 库存操作记录 */
export interface InventoryOperation {
    /** 操作ID */
    id: string
    /** 操作类型 */
    type: InventoryOperationType
    /** 物料编码 */
    materialCode: string
    /** 物料名称 */
    materialName: string
    /** 源库位 */
    fromLocation?: string
    /** 目标库位 */
    toLocation?: string
    /** 数量 */
    quantity: number
    /** 单位 */
    unit: string
    /** 批次号 */
    batchNo?: string
    /** 操作员 */
    operator: string
    /** 操作时间 */
    operationTime: string
    /** 单据号 */
    documentNo?: string
    /** 备注 */
    remark?: string
}

/** 扫码结果 */
export interface ScanResult {
    /** 码类型 */
    type: 'barcode' | 'qrcode'
    /** 码内容 */
    content: string
    /** 码格式 */
    format: string
    /** 扫码时间戳 */
    timestamp: number
    /** 业务类型 */
    businessType?: string
    /** 业务数据 */
    businessData?: Record<string, unknown>
}

/** 设备状态 */
export type EquipmentStatus = 'running' | 'idle' | 'maintenance' | 'fault' | 'offline'

/** 设备信息 */
export interface Equipment {
    /** 设备ID */
    id: string
    /** 设备编码 */
    code: string
    /** 设备名称 */
    name: string
    /** 设备类型 */
    type: string
    /** 设备状态 */
    status: EquipmentStatus
    /** 所属工作中心 */
    workCenter?: string
    /** 当前工单 */
    currentWorkOrder?: string
    /** 运行参数 */
    parameters?: Record<string, number | string>
    /** 最后更新时间 */
    lastUpdateTime: string
}

/** 异常类型 */
export type ExceptionType = 'quality' | 'equipment' | 'material' | 'process' | 'other'

/** 异常状态 */
export type ExceptionStatus = 'pending' | 'processing' | 'resolved' | 'closed'

/** 异常记录 */
export interface ExceptionRecord {
    /** 异常ID */
    id: string
    /** 异常编号 */
    exceptionNo: string
    /** 异常类型 */
    type: ExceptionType
    /** 异常状态 */
    status: ExceptionStatus
    /** 异常描述 */
    description: string
    /** 关联工单 */
    workOrderId?: string
    /** 关联设备 */
    equipmentId?: string
    /** 上报人 */
    reporter: string
    /** 上报时间 */
    reportTime: string
    /** 处理人 */
    handler?: string
    /** 处理时间 */
    handleTime?: string
    /** 处理结果 */
    handleResult?: string
    /** 附件 */
    attachments?: string[]
}
