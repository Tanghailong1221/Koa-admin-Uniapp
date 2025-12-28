<template>
    <view class="m-form">
        <view v-for="field in fields" :key="field.name" class="m-form__item" :class="{ 'm-form__item--required': field.required }">
            <view v-if="field.label" class="m-form__label">{{ field.label }}</view>
            <view class="m-form__content">
                <!-- 文本输入 -->
                <input
                    v-if="field.type === 'text' || field.type === 'number' || field.type === 'tel'"
                    class="m-form__input"
                    :type="field.type"
                    :value="formData[field.name]"
                    :placeholder="field.placeholder || `请输入${field.label}`"
                    :disabled="field.disabled"
                    :maxlength="field.maxlength"
                    @input="handleInput(field.name, $event)"
                    @blur="handleBlur(field.name)"
                />

                <!-- 密码输入 -->
                <input
                    v-else-if="field.type === 'password'"
                    class="m-form__input"
                    type="text"
                    :password="true"
                    :value="formData[field.name]"
                    :placeholder="field.placeholder || `请输入${field.label}`"
                    :disabled="field.disabled"
                    @input="handleInput(field.name, $event)"
                    @blur="handleBlur(field.name)"
                />

                <!-- 多行文本 -->
                <textarea
                    v-else-if="field.type === 'textarea'"
                    class="m-form__textarea"
                    :value="String(formData[field.name] ?? '')"
                    :placeholder="field.placeholder || `请输入${field.label}`"
                    :disabled="field.disabled"
                    :maxlength="field.maxlength"
                    @input="handleInput(field.name, $event)"
                    @blur="handleBlur(field.name)"
                ></textarea>

                <!-- 选择器 -->
                <picker
                    v-else-if="field.type === 'select'"
                    class="m-form__picker"
                    :value="getPickerIndex(field)"
                    :range="field.options || []"
                    :range-key="field.optionLabel || 'label'"
                    :disabled="field.disabled"
                    @change="handlePickerChange(field, $event)"
                >
                    <view class="m-form__picker-value">
                        {{ getPickerDisplay(field) || field.placeholder || `请选择${field.label}` }}
                    </view>
                </picker>

                <!-- 日期选择 -->
                <picker
                    v-else-if="field.type === 'date'"
                    class="m-form__picker"
                    mode="date"
                    :value="formData[field.name] || ''"
                    :disabled="field.disabled"
                    @change="handleDateChange(field.name, $event)"
                >
                    <view class="m-form__picker-value">
                        {{ formData[field.name] || field.placeholder || `请选择${field.label}` }}
                    </view>
                </picker>

                <!-- 时间选择 -->
                <picker
                    v-else-if="field.type === 'time'"
                    class="m-form__picker"
                    mode="time"
                    :value="formData[field.name] || ''"
                    :disabled="field.disabled"
                    @change="handleTimeChange(field.name, $event)"
                >
                    <view class="m-form__picker-value">
                        {{ formData[field.name] || field.placeholder || `请选择${field.label}` }}
                    </view>
                </picker>

                <!-- 开关 -->
                <switch
                    v-else-if="field.type === 'switch'"
                    class="m-form__switch"
                    :checked="!!formData[field.name]"
                    :disabled="field.disabled"
                    @change="handleSwitchChange(field.name, $event as unknown as { detail: { value: boolean } })"
                />
            </view>
            <view v-if="errors[field.name]" class="m-form__error">{{ errors[field.name] }}</view>
        </view>
        <view v-if="$slots.footer" class="m-form__footer">
            <slot name="footer"></slot>
        </view>
    </view>
</template>

<script setup lang="ts">
import { ref, reactive, watch, useSlots } from 'vue'

export interface FormField {
    /** 字段名 */
    name: string
    /** 标签 */
    label?: string
    /** 字段类型 */
    type: 'text' | 'number' | 'tel' | 'password' | 'textarea' | 'select' | 'date' | 'time' | 'switch'
    /** 占位文本 */
    placeholder?: string
    /** 是否必填 */
    required?: boolean
    /** 是否禁用 */
    disabled?: boolean
    /** 最大长度 */
    maxlength?: number
    /** 选项列表（select类型） */
    options?: Array<{ label: string; value: unknown }>
    /** 选项标签字段 */
    optionLabel?: string
    /** 选项值字段 */
    optionValue?: string
    /** 默认值 */
    defaultValue?: unknown
    /** 验证规则 */
    rules?: FormRule[]
}

export interface FormRule {
    /** 是否必填 */
    required?: boolean
    /** 错误消息 */
    message: string
    /** 最小长度 */
    min?: number
    /** 最大长度 */
    max?: number
    /** 正则表达式 */
    pattern?: RegExp
    /** 自定义验证函数 */
    validator?: (value: unknown) => boolean | Promise<boolean>
}

export interface MFormProps {
    /** 表单字段配置 */
    fields: FormField[]
    /** 表单数据 */
    modelValue?: Record<string, unknown>
    /** 标签宽度 */
    labelWidth?: string | number
}

const props = withDefaults(defineProps<MFormProps>(), {
    fields: () => [],
    modelValue: () => ({}),
    labelWidth: 160,
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: Record<string, unknown>): void
    (e: 'change', name: string, value: unknown): void
    (e: 'blur', name: string): void
    (e: 'submit', data: Record<string, unknown>): void
}>()

const $slots = useSlots()

// 表单数据
const formData = reactive<Record<string, unknown>>({})
const errors = reactive<Record<string, string>>({})

// 初始化表单数据
const initFormData = () => {
    props.fields.forEach((field) => {
        if (props.modelValue[field.name] !== undefined) {
            formData[field.name] = props.modelValue[field.name]
        } else if (field.defaultValue !== undefined) {
            formData[field.name] = field.defaultValue
        } else {
            formData[field.name] = field.type === 'switch' ? false : ''
        }
    })
}

// 监听外部数据变化
watch(
    () => props.modelValue,
    (newVal) => {
        Object.keys(newVal).forEach((key) => {
            formData[key] = newVal[key]
        })
    },
    { deep: true }
)

// 监听字段配置变化
watch(
    () => props.fields,
    () => {
        initFormData()
    },
    { immediate: true }
)

// 处理输入
const handleInput = (name: string, event: Event) => {
    const target = event.target as HTMLInputElement
    const value = target.value
    formData[name] = value
    emit('update:modelValue', { ...formData })
    emit('change', name, value)
    // 清除错误
    if (errors[name]) {
        errors[name] = ''
    }
}

// 处理失焦
const handleBlur = (name: string) => {
    emit('blur', name)
    validateField(name)
}

// 处理选择器变化
const handlePickerChange = (field: FormField, event: { detail: { value: number } }) => {
    const index = event.detail.value
    const options = field.options || []
    const valueField = field.optionValue || 'value'
    const value = options[index]?.[valueField as keyof typeof options[0]]
    formData[field.name] = value
    emit('update:modelValue', { ...formData })
    emit('change', field.name, value)
}

// 处理日期变化
const handleDateChange = (name: string, event: { detail: { value: string } }) => {
    const value = event.detail.value
    formData[name] = value
    emit('update:modelValue', { ...formData })
    emit('change', name, value)
}

// 处理时间变化
const handleTimeChange = (name: string, event: { detail: { value: string } }) => {
    const value = event.detail.value
    formData[name] = value
    emit('update:modelValue', { ...formData })
    emit('change', name, value)
}

// 处理开关变化
const handleSwitchChange = (name: string, event: { detail: { value: boolean } }) => {
    const value = event.detail.value
    formData[name] = value
    emit('update:modelValue', { ...formData })
    emit('change', name, value)
}

// 获取选择器索引
const getPickerIndex = (field: FormField): number => {
    const value = formData[field.name]
    const options = field.options || []
    const valueField = field.optionValue || 'value'
    return options.findIndex((opt) => opt[valueField as keyof typeof opt] === value)
}

// 获取选择器显示文本
const getPickerDisplay = (field: FormField): string => {
    const value = formData[field.name]
    const options = field.options || []
    const valueField = field.optionValue || 'value'
    const labelField = field.optionLabel || 'label'
    const option = options.find((opt) => opt[valueField as keyof typeof opt] === value)
    return option ? String(option[labelField as keyof typeof option]) : ''
}

// 验证单个字段
const validateField = async (name: string): Promise<boolean> => {
    const field = props.fields.find((f) => f.name === name)
    if (!field) return true

    const value = formData[name]
    const rules = field.rules || []

    // 必填验证
    if (field.required && (value === '' || value === null || value === undefined)) {
        errors[name] = `${field.label || name}不能为空`
        return false
    }

    // 规则验证
    for (const rule of rules) {
        if (rule.required && (value === '' || value === null || value === undefined)) {
            errors[name] = rule.message
            return false
        }

        if (rule.min !== undefined && typeof value === 'string' && value.length < rule.min) {
            errors[name] = rule.message
            return false
        }

        if (rule.max !== undefined && typeof value === 'string' && value.length > rule.max) {
            errors[name] = rule.message
            return false
        }

        if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
            errors[name] = rule.message
            return false
        }

        if (rule.validator) {
            const result = await rule.validator(value)
            if (!result) {
                errors[name] = rule.message
                return false
            }
        }
    }

    errors[name] = ''
    return true
}

// 验证所有字段
const validate = async (): Promise<boolean> => {
    let valid = true
    for (const field of props.fields) {
        const fieldValid = await validateField(field.name)
        if (!fieldValid) {
            valid = false
        }
    }
    return valid
}

// 提交表单
const submit = async (): Promise<Record<string, unknown> | null> => {
    const valid = await validate()
    if (valid) {
        emit('submit', { ...formData })
        return { ...formData }
    }
    return null
}

// 重置表单
const reset = () => {
    initFormData()
    Object.keys(errors).forEach((key) => {
        errors[key] = ''
    })
    emit('update:modelValue', { ...formData })
}

// 设置字段值
const setFieldValue = (name: string, value: unknown) => {
    formData[name] = value
    emit('update:modelValue', { ...formData })
}

// 获取字段值
const getFieldValue = (name: string): unknown => {
    return formData[name]
}

// 暴露方法
defineExpose({
    validate,
    submit,
    reset,
    setFieldValue,
    getFieldValue,
    formData,
    errors,
})
</script>

<style lang="scss" scoped>
.m-form {
    width: 100%;

    &__item {
        margin-bottom: 24rpx;

        &--required {
            .m-form__label::before {
                content: '*';
                color: #f56c6c;
                margin-right: 8rpx;
            }
        }
    }

    &__label {
        font-size: 28rpx;
        color: #303133;
        margin-bottom: 12rpx;
    }

    &__content {
        width: 100%;
    }

    &__input,
    &__textarea {
        width: 100%;
        padding: 20rpx;
        font-size: 28rpx;
        color: #303133;
        background-color: #fff;
        border: 1px solid #dcdfe6;
        border-radius: 8rpx;
        box-sizing: border-box;

        &::placeholder {
            color: #c0c4cc;
        }

        &:focus {
            border-color: #409eff;
        }

        &:disabled {
            background-color: #f5f7fa;
            color: #c0c4cc;
            cursor: not-allowed;
        }
    }

    &__textarea {
        min-height: 160rpx;
        line-height: 1.5;
    }

    &__picker {
        width: 100%;
    }

    &__picker-value {
        padding: 20rpx;
        font-size: 28rpx;
        color: #303133;
        background-color: #fff;
        border: 1px solid #dcdfe6;
        border-radius: 8rpx;

        &:empty::before {
            content: attr(data-placeholder);
            color: #c0c4cc;
        }
    }

    &__switch {
        transform: scale(0.9);
    }

    &__error {
        font-size: 24rpx;
        color: #f56c6c;
        margin-top: 8rpx;
    }

    &__footer {
        margin-top: 32rpx;
    }
}
</style>
