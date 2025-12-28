<template>
    <view class="m-input" :class="[`m-input--${size}`, { 'm-input--disabled': disabled, 'm-input--error': error }]">
        <view v-if="label" class="m-input__label">{{ label }}</view>
        <view class="m-input__wrapper">
            <view v-if="prefixIcon" class="m-input__prefix">
                <text :class="prefixIcon"></text>
            </view>
            <input
                class="m-input__inner"
                :type="inputType"
                :value="modelValue"
                :placeholder="placeholder"
                :disabled="disabled"
                :maxlength="maxlength"
                :password="type === 'password' && !showPassword"
                @input="handleInput"
                @focus="handleFocus"
                @blur="handleBlur"
                @confirm="handleConfirm"
            />
            <view v-if="clearable && modelValue" class="m-input__clear" @click="handleClear">
                <text class="m-icon-close"></text>
            </view>
            <view v-if="type === 'password'" class="m-input__password" @click="togglePassword">
                <text :class="showPassword ? 'm-icon-eye' : 'm-icon-eye-off'"></text>
            </view>
            <view v-if="suffixIcon" class="m-input__suffix">
                <text :class="suffixIcon"></text>
            </view>
        </view>
        <view v-if="error && errorMessage" class="m-input__error">{{ errorMessage }}</view>
    </view>
</template>

<script setup lang="ts">
import { ref, computed, defineProps, defineEmits } from 'vue'

export interface MInputProps {
    /** 绑定值 */
    modelValue?: string | number
    /** 输入框类型 */
    type?: 'text' | 'number' | 'password' | 'tel' | 'digit'
    /** 占位文本 */
    placeholder?: string
    /** 标签文本 */
    label?: string
    /** 是否禁用 */
    disabled?: boolean
    /** 是否可清空 */
    clearable?: boolean
    /** 最大长度 */
    maxlength?: number
    /** 尺寸 */
    size?: 'large' | 'medium' | 'small'
    /** 前缀图标 */
    prefixIcon?: string
    /** 后缀图标 */
    suffixIcon?: string
    /** 是否错误状态 */
    error?: boolean
    /** 错误提示信息 */
    errorMessage?: string
}

const props = withDefaults(defineProps<MInputProps>(), {
    modelValue: '',
    type: 'text',
    placeholder: '请输入',
    label: '',
    disabled: false,
    clearable: false,
    maxlength: -1,
    size: 'medium',
    prefixIcon: '',
    suffixIcon: '',
    error: false,
    errorMessage: '',
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: string | number): void
    (e: 'input', value: string | number): void
    (e: 'focus', event: FocusEvent): void
    (e: 'blur', event: FocusEvent): void
    (e: 'clear'): void
    (e: 'confirm', value: string | number): void
}>()

const showPassword = ref(false)

const inputType = computed(() => {
    if (props.type === 'password') {
        return 'text'
    }
    return props.type
})

const handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement
    const value = props.type === 'number' ? Number(target.value) : target.value
    emit('update:modelValue', value)
    emit('input', value)
}

const handleFocus = (event: FocusEvent) => {
    emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
    emit('blur', event)
}

const handleClear = () => {
    emit('update:modelValue', '')
    emit('clear')
}

const handleConfirm = () => {
    emit('confirm', props.modelValue ?? '')
}

const togglePassword = () => {
    showPassword.value = !showPassword.value
}
</script>

<style lang="scss" scoped>
.m-input {
    width: 100%;

    &__label {
        font-size: 28rpx;
        color: #303133;
        margin-bottom: 12rpx;
    }

    &__wrapper {
        display: flex;
        align-items: center;
        background-color: #fff;
        border: 1px solid #dcdfe6;
        border-radius: 8rpx;
        padding: 0 20rpx;
        transition: border-color 0.2s;

        &:focus-within {
            border-color: #409eff;
        }
    }

    &__inner {
        flex: 1;
        height: 100%;
        font-size: 28rpx;
        color: #303133;
        background: transparent;
        border: none;
        outline: none;

        &::placeholder {
            color: #c0c4cc;
        }
    }

    &__prefix,
    &__suffix {
        color: #c0c4cc;
        margin-right: 8rpx;
    }

    &__suffix {
        margin-right: 0;
        margin-left: 8rpx;
    }

    &__clear,
    &__password {
        color: #c0c4cc;
        margin-left: 8rpx;
        cursor: pointer;

        &:active {
            color: #909399;
        }
    }

    &__error {
        font-size: 24rpx;
        color: #f56c6c;
        margin-top: 8rpx;
    }

    &--large {
        .m-input__wrapper {
            height: 88rpx;
        }

        .m-input__inner {
            font-size: 32rpx;
        }
    }

    &--medium {
        .m-input__wrapper {
            height: 72rpx;
        }
    }

    &--small {
        .m-input__wrapper {
            height: 56rpx;
        }

        .m-input__inner {
            font-size: 24rpx;
        }
    }

    &--disabled {
        .m-input__wrapper {
            background-color: #f5f7fa;
            cursor: not-allowed;
        }

        .m-input__inner {
            color: #c0c4cc;
            cursor: not-allowed;
        }
    }

    &--error {
        .m-input__wrapper {
            border-color: #f56c6c;
        }
    }
}
</style>
