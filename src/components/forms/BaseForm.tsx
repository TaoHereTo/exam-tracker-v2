"use client";

import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import toast from 'react-hot-toast';
import { validateField, validateForm, ValidationSchema, FormErrors, FormData } from "@/lib/formValidation";
import { FormError } from "@/components/ui/form-error";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { MixedText } from "@/components/ui/MixedText";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// 使用统一的验证工具类型

// 基础表单属性
export interface BaseFormProps {
    onSubmit: (data: FormData, errors?: FormErrors) => void;
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
    errorsVersion: number;
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
    const [errorsVersion, setErrorsVersion] = useState<number>(0);
    const initialDataRef = useRef(initialData);

    // 当初始数据变化时重置表单
    useEffect(() => {
        // 只有当initialData实际发生变化时才重置表单
        // 使用useRef来存储前一个initialData的引用
        const prevInitialData = initialDataRef.current;

        // 深度比较两个对象
        const hasChanged = JSON.stringify(prevInitialData) !== JSON.stringify(initialData);

        if (hasChanged) {
            initialDataRef.current = initialData;
            setValues(initialData);
            setErrors({});
        }
    }, [initialData]); // 使用initialData作为依赖项

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
        // 每次触发验证都递增版本，以便错误提示重新显示
        setErrorsVersion(prev => prev + 1);
        return Object.keys(newErrors).length === 0;
    };

    // 处理表单提交
    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        // 提交前进行一次强制校验并显示每个字段的错误
        const newErrors = validateForm(values, validationSchema);
        setErrors(newErrors);
        // 每次触发验证都递增版本，以便错误提示重新显示
        setErrorsVersion(prev => prev + 1);

        // 总是调用onSubmit，将验证结果传递给它
        try {
            onSubmit(values, newErrors);

            // 如果有验证错误，不继续处理（但已经调用了onSubmit让子组件处理错误显示）
            if (Object.keys(newErrors).length > 0) {
                return;
            }

            // showSuccess(); // Removed per user request - only show notification on knowledge save

            if (resetOnSubmit) {
                // 使用setTimeout来避免在同一个渲染周期中设置状态
                setTimeout(() => {
                    setValues(initialData);
                    setErrors({});
                }, 0);
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : '保存失败');
        }
    };

    // 表单上下文值
    const contextValue: FormContextType = {
        values,
        errors,
        errorsVersion,
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
    const { errors, errorsVersion } = useFormContext();
    const error = errors[name];

    return (
        <div className={`relative ${className}`}>
            {children}
            <FormError key={`${name}-${errorsVersion}`} error={error} />
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
            className={`transition-all ${className}`}
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
        <Input
            type={type}
            name={name}
            value={String(value)}
            onChange={(e) => setValue(name, e.target.value)}
            placeholder={placeholder}
            className={`${className}`}
            onKeyDown={onKeyDown}
        />
    );
}

// 表单选择组件
export interface FormSelectProps {
    name: string;
    placeholder?: string | React.ReactNode;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

export function FormSelect({ name, placeholder, children, className = '', style }: FormSelectProps) {
    const { values, setValue, errors } = useFormContext();
    const value = values[name] || '';
    const error = errors[name];

    return (
        <Select
            value={String(value)}
            onValueChange={(newValue) => setValue(name, newValue)}
        >
            <SelectTrigger
                className={`w-full ${className}`}
            >
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {children}
            </SelectContent>
        </Select>
    );
}

// 表单文本域组件
export interface FormTextareaProps {
    name: string;
    placeholder?: string;
    className?: string;
    rows?: number;
    onKeyDown?: (e: React.KeyboardEvent) => void;
}

export function FormTextarea({ name, placeholder, className = '', rows = 4, onKeyDown }: FormTextareaProps) {
    const { values, setValue, errors, clearError } = useFormContext();
    const value = values[name] || '';
    const error = errors[name];

    return (
        <Textarea
            name={name}
            value={String(value)}
            onChange={(e) => {
                setValue(name, e.target.value);
                if (error) {
                    clearError(name);
                }
            }}
            placeholder={placeholder}
            className={cn(
                "resize-none",
                className
            )}
            rows={rows}
            onKeyDown={onKeyDown}
        />
    );
} 