"use client";

import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { useNotification } from "@/components/magicui/NotificationProvider";

// 表单数据类型
export interface FormData {
    [key: string]: string | number | boolean | undefined;
}

// 表单验证规则类型
export interface ValidationRule {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: string | number | boolean | undefined, allValues?: FormData) => string | null;
}

// 表单验证模式
export interface ValidationSchema {
    [fieldName: string]: ValidationRule;
}

// 表单错误类型
export interface FormErrors {
    [fieldName: string]: string;
}

// 基础表单属性
export interface BaseFormProps {
    onSubmit: (data: FormData) => void;
    validationSchema?: ValidationSchema;
    children: React.ReactNode;
    className?: string;
    initialData?: FormData;
    resetOnSubmit?: boolean;
}

// 表单上下文类型
export interface FormContextType {
    values: FormData;
    errors: FormErrors;
    setValue: (field: string, value: string | number | boolean | undefined) => void;
    setError: (field: string, error: string) => void;
    clearError: (field: string) => void;
    validateField: (field: string, value: string | number | boolean | undefined) => string | null;
    validateForm: () => boolean;
    getValue: (field: string) => string | number | boolean | undefined;
}

// 创建表单上下文
const FormContext = createContext<FormContextType | null>(null);

// 表单上下文Hook
export function useFormContext() {
    const context = useContext(FormContext);
    if (!context) {
        throw new Error('useFormContext must be used within a BaseForm');
    }
    return context;
}

// 基础表单组件
export function BaseForm({
    onSubmit,
    validationSchema = {},
    children,
    className = '',
    initialData = {},
    resetOnSubmit = true
}: BaseFormProps) {
    const [values, setValues] = useState<FormData>(initialData);
    const [errors, setErrors] = useState<FormErrors>({});
    const { notify } = useNotification();
    const initialDataRef = useRef(initialData);

    // 当初始数据变化时重置表单
    useEffect(() => {
        const currentInitialDataStr = JSON.stringify(initialDataRef.current);
        const newInitialDataStr = JSON.stringify(initialData);

        if (currentInitialDataStr !== newInitialDataStr) {
            initialDataRef.current = initialData;
            setValues(initialData);
            setErrors({});
        }
    }, [initialData]);

    // 设置字段值
    const setValue = (field: string, value: string | number | boolean | undefined) => {
        setValues(prev => ({ ...prev, [field]: value }));
        // 清除该字段的错误
        if (errors[field]) {
            clearError(field);
        }
    };

    // 获取字段值
    const getValue = (field: string): string | number | boolean | undefined => {
        return values[field];
    };

    // 设置字段错误
    const setError = (field: string, error: string) => {
        setErrors(prev => ({ ...prev, [field]: error }));
    };

    // 清除字段错误
    const clearError = (field: string) => {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field];
            return newErrors;
        });
    };

    // 验证单个字段
    const validateField = (field: string, value: string | number | boolean | undefined): string | null => {
        const rule = validationSchema[field];
        if (!rule) return null;

        // 必填验证
        if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
            return `${field} 是必填项`;
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
            const customError = rule.custom(value, values);
            if (customError) return customError;
        }

        return null;
    };

    // 验证整个表单
    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        let isValid = true;

        Object.keys(validationSchema).forEach(field => {
            const error = validateField(field, values[field]);
            if (error) {
                newErrors[field] = error;
                isValid = false;
            }
        });

        setErrors(newErrors);
        return isValid;
    };

    // 处理表单提交
    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!validateForm()) {
            notify({ type: "error", message: "请完善表单信息" });
            return;
        }

        try {
            onSubmit(values);
            notify({ type: "success", message: "保存成功" });

            if (resetOnSubmit) {
                setValues(initialData);
                setErrors({});
            }
        } catch (error) {
            notify({ type: "error", message: "保存失败", description: error instanceof Error ? error.message : '未知错误' });
        }
    };

    // 表单上下文值
    const contextValue: FormContextType = {
        values,
        errors,
        setValue,
        setError,
        clearError,
        validateField,
        validateForm,
        getValue
    };

    return (
        <FormContext.Provider value={contextValue}>
            <form onSubmit={handleSubmit} className={className}>
                {children}
            </form>
        </FormContext.Provider>
    );
}

// 表单字段组件
export interface FormFieldProps {
    name: string;
    children: React.ReactNode;
    className?: string;
}

export function FormField({ name, children, className = '' }: FormFieldProps) {
    const { errors } = useFormContext();
    const error = errors[name];

    return (
        <div className={`space-y-2 ${className}`}>
            {children}
            {error && (
                <p className="text-sm text-red-500">{error}</p>
            )}
        </div>
    );
}

// 表单按钮组件
export interface FormButtonProps {
    children: React.ReactNode;
    type?: 'submit' | 'button';
    onClick?: () => void;
    className?: string;
    disabled?: boolean;
}

export function FormButton({
    children,
    type = 'submit',
    onClick,
    className = '',
    disabled = false
}: FormButtonProps) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={className}
        >
            {children}
        </button>
    );
}

// 表单输入组件
export interface FormInputProps {
    name: string;
    type?: string;
    placeholder?: string;
    className?: string;
    onKeyDown?: (e: React.KeyboardEvent) => void;
}

export function FormInput({ name, type = "text", placeholder, className = '', onKeyDown }: FormInputProps) {
    const { values, setValue, errors } = useFormContext();
    const value = values[name] || '';
    const error = errors[name];

    return (
        <input
            type={type}
            name={name}
            value={String(value)}
            onChange={(e) => setValue(name, e.target.value)}
            placeholder={placeholder}
            className={`border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:ring-[3px] ${error ? 'border-red-500' : ''} ${className}`}
            onKeyDown={onKeyDown}
        />
    );
}

// 表单选择组件
export interface FormSelectProps {
    name: string;
    placeholder?: string;
    children: React.ReactNode;
    className?: string;
}

export function FormSelect({ name, placeholder, children, className = '' }: FormSelectProps) {
    const { values, setValue, errors } = useFormContext();
    const value = values[name] || '';
    const error = errors[name];

    return (
        <select
            name={name}
            value={String(value)}
            onChange={(e) => setValue(name, e.target.value)}
            className={`border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 ${error ? 'border-red-500' : ''} ${className}`}
        >
            <option value="">{placeholder}</option>
            {children}
        </select>
    );
} 