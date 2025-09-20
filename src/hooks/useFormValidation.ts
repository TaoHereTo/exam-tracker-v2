import { useState, useCallback } from 'react';

/**
 * 表单验证错误类型
 */
export interface ValidationErrors {
    [key: string]: string;
}

/**
 * 表单验证规则类型
 */
export interface ValidationRule {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: string | number | boolean) => string | null;
}

/**
 * 表单验证规则集合
 */
export interface ValidationRules {
    [key: string]: ValidationRule;
}

/**
 * 统一的表单验证 Hook
 * 提供标准化的表单验证功能
 */
export const useFormValidation = (rules: ValidationRules) => {
    const [errors, setErrors] = useState<ValidationErrors>({});

    /**
     * 验证单个字段
     * @param field 字段名
     * @param value 字段值
     * @returns 错误信息或 null
     */
    const validateField = useCallback((field: string, value: string | number | boolean): string | null => {
        const rule = rules[field];
        if (!rule) return null;

        // 必填验证
        if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
            return `${field} 是必填项`;
        }

        // 如果值为空且不是必填，跳过其他验证
        if (!value || (typeof value === 'string' && !value.trim())) {
            return null;
        }

        // 最小长度验证
        if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
            return `${field} 至少需要 ${rule.minLength} 个字符`;
        }

        // 最大长度验证
        if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
            return `${field} 不能超过 ${rule.maxLength} 个字符`;
        }

        // 正则表达式验证
        if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
            return `${field} 格式不正确`;
        }

        // 自定义验证
        if (rule.custom) {
            return rule.custom(value);
        }

        return null;
    }, [rules]);

    /**
     * 验证所有字段
     * @param data 表单数据
     * @returns 是否有错误
     */
    const validateAll = useCallback((data: Record<string, string | number | boolean>): boolean => {
        const newErrors: ValidationErrors = {};
        let hasErrors = false;

        Object.keys(rules).forEach(field => {
            const error = validateField(field, data[field]);
            if (error) {
                newErrors[field] = error;
                hasErrors = true;
            }
        });

        setErrors(newErrors);
        return !hasErrors;
    }, [rules, validateField]);

    /**
     * 验证单个字段并更新错误状态
     * @param field 字段名
     * @param value 字段值
     * @returns 是否有错误
     */
    const validateAndSetError = useCallback((field: string, value: string | number | boolean): boolean => {
        const error = validateField(field, value);
        setErrors(prev => ({
            ...prev,
            [field]: error || ''
        }));
        return !error;
    }, [validateField]);

    /**
     * 清除指定字段的错误
     * @param field 字段名
     */
    const clearError = useCallback((field: string) => {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
        });
    }, []);

    /**
     * 清除所有错误
     */
    const clearAllErrors = useCallback(() => {
        setErrors({});
    }, []);

    /**
     * 设置错误
     * @param field 字段名
     * @param error 错误信息
     */
    const setError = useCallback((field: string, error: string) => {
        setErrors(prev => ({
            ...prev,
            [field]: error
        }));
    }, []);

    return {
        errors,
        validateField,
        validateAll,
        validateAndSetError,
        clearError,
        clearAllErrors,
        setError,
    };
};
