// 表单验证工具

export interface ValidationRule {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: string | number | boolean | undefined, allValues?: Record<string, unknown>) => string | null;
}

export interface ValidationSchema {
    [fieldName: string]: ValidationRule;
}

export interface FormErrors {
    [fieldName: string]: string;
}

export interface FormData {
    [key: string]: string | number | boolean | undefined;
}

/**
 * 验证单个字段
 */
export function validateField(
    field: string,
    value: string | number | boolean | undefined,
    rule: ValidationRule,
    allValues?: FormData
): string | null {
    // 必填验证
    if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
        // 如果有自定义错误消息，优先使用它
        if (rule.custom) {
            const customError = rule.custom(value);
            if (customError) return customError;
        }
        // 默认的必填消息
        return `请填写此项`;
    }

    // 长度验证
    if (typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
            return `${field} 最少需要 ${rule.minLength} 个字符`;
        }
        if (rule.maxLength && value.length > rule.maxLength) {
            return `${field} 最多只能有 ${rule.maxLength} 个字符`;
        }
    }

    // 正则验证
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        return `${field} 格式不正确`;
    }

    // 自定义验证
    if (rule.custom) {
        const customError = rule.custom(value, allValues);
        if (customError) return customError;
    }

    return null;
}

/**
 * 验证整个表单
 */
export function validateForm(values: FormData, validationSchema: ValidationSchema): FormErrors {
    const errors: FormErrors = {};

    Object.keys(validationSchema).forEach(field => {
        const error = validateField(field, values[field], validationSchema[field], values);
        if (error) {
            errors[field] = error;
        }
    });

    return errors;
}

/**
 * 检查表单是否有效
 */
export function isFormValid(values: FormData, validationSchema: ValidationSchema): boolean {
    const errors = validateForm(values, validationSchema);
    return Object.keys(errors).length === 0;
}

/**
 * 通用表单验证规则
 */
export const commonValidationRules = {
    required: (): ValidationRule => ({
        required: true
    }),

    minLength: (_: string, min: number): ValidationRule => ({
        minLength: min
    }),

    maxLength: (_: string, max: number): ValidationRule => ({
        maxLength: max
    }),

    email: (): ValidationRule => ({
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    }),

    phone: (): ValidationRule => ({
        pattern: /^1[3-9]\d{9}$/
    }),

    number: (): ValidationRule => ({
        pattern: /^\d+$/
    }),

    positiveNumber: (fieldName: string): ValidationRule => ({
        custom: (value) => {
            const num = Number(value);
            if (isNaN(num) || num <= 0) {
                return `${fieldName} 必须是正数`;
            }
            return null;
        }
    }),

    percentage: (fieldName: string): ValidationRule => ({
        custom: (value) => {
            const num = Number(value);
            if (isNaN(num) || num < 0 || num > 100) {
                return `${fieldName} 必须是0-100之间的数字`;
            }
            return null;
        }
    })
};

/**
 * 创建表单验证schema的辅助函数
 */
export function createValidationSchema(rules: Record<string, ValidationRule[]>): ValidationSchema {
    const schema: ValidationSchema = {};

    Object.entries(rules).forEach(([field, fieldRules]) => {
        schema[field] = fieldRules.reduce((merged, rule) => ({
            ...merged,
            ...rule
        }), {} as ValidationRule);
    });

    return schema;
} 