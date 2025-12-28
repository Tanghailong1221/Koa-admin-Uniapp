// 主题配置
export const themeConfig = {
    // 主色调
    primaryColor: '#1890ff',
    // 成功色
    successColor: '#52c41a',
    // 警告色
    warningColor: '#faad14',
    // 错误色
    errorColor: '#f5222d',
    // 文字颜色
    textColor: '#333333',
    // 次要文字颜色
    textColorSecondary: '#666666',
    // 边框颜色
    borderColor: '#e8e8e8',
    // 背景颜色
    backgroundColor: '#f5f5f5',
}

// 设备布局配置
export const layoutConfigs = {
    phone: {
        columns: 1,
        gutter: 12,
        fontSize: { base: 14, small: 12, large: 16 },
        touchArea: { minWidth: 44, minHeight: 44 },
    },
    tablet: {
        columns: 2,
        gutter: 16,
        fontSize: { base: 16, small: 14, large: 18 },
        touchArea: { minWidth: 48, minHeight: 48 },
    },
    pda: {
        columns: 1,
        gutter: 8,
        fontSize: { base: 16, small: 14, large: 18 },
        touchArea: { minWidth: 56, minHeight: 56 },
    },
}
