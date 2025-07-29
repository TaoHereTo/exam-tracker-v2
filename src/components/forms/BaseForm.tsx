"use client";

import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { useNotification } from "@/components/magicui/NotificationProvider";
import { validateField, validateForm, ValidationSchema, FormErrors, FormData } from "@/lib/formValidation";
import { FormError } from "@/components/ui/form-error";
import { Select, SelectTrigger, SelectValue, SelectContent } from "@/components/ui/select";

// 使用统一的验证工具类型

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
    const validateFieldLocal = (field: string, value: string | number | boolean | undefined): string | null => {
        const rule = validationSchema[field];
        if (!rule) return null;
        return validateField(field, value, rule, values);
    };

    // 验证整个表单
    const validateFormLocal = (): boolean => {
        const newErrors = validateForm(values, validationSchema);
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 处理表单提交
    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!validateFormLocal()) {
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
        validateField: validateFieldLocal,
        validateForm: validateFormLocal,
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
        <div className={`relative ${className}`}>
            {children}
            <FormError error={error} />
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
            className={`border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:ring-[3px] ${error ? 'border-red-500 ring-red-500/20' : ''} ${className}`}
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
        <Select
            value={String(value)}
            onValueChange={(newValue) => setValue(name, newValue)}
        >
            <SelectTrigger className={`w-full ${error ? 'border-red-500 ring-red-500/20' : ''} ${className}`}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {children}
            </SelectContent>
        </Select>
    );
} 