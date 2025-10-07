'use client'

import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface OTPInputProps {
    value: string
    onChange: (value: string) => void
    length?: number
    className?: string
    disabled?: boolean
}

export function OTPInput({
    value,
    onChange,
    length = 6,
    className,
    disabled = false
}: OTPInputProps) {
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null)
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    // 初始化refs数组
    useEffect(() => {
        inputRefs.current = inputRefs.current.slice(0, length)
    }, [length])

    // 处理输入变化
    const handleInputChange = (index: number, inputValue: string) => {
        // 只允许数字
        const numericValue = inputValue.replace(/[^0-9]/g, '')

        if (numericValue.length > 1) {
            // 如果输入多个字符，只取第一个
            const firstChar = numericValue[0]
            updateValue(index, firstChar)

            // 自动跳转到下一个输入框
            if (index < length - 1) {
                inputRefs.current[index + 1]?.focus()
            }
        } else if (numericValue.length === 1) {
            updateValue(index, numericValue)

            // 自动跳转到下一个输入框
            if (index < length - 1) {
                inputRefs.current[index + 1]?.focus()
            }
        } else {
            // 删除字符
            updateValue(index, '')
        }
    }

    // 更新值
    const updateValue = (index: number, char: string) => {
        const newValue = value.split('')
        newValue[index] = char
        const filteredValue = newValue.filter((_, i) => i < length).join('')
        onChange(filteredValue)
    }

    // 处理键盘事件
    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (!value[index] && index > 0) {
                // 如果当前输入框为空，跳转到前一个
                inputRefs.current[index - 1]?.focus()
                updateValue(index - 1, '')
            } else {
                updateValue(index, '')
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus()
        } else if (e.key === 'ArrowRight' && index < length - 1) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    // 处理粘贴
    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault()
        const pasteData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, length)

        if (pasteData) {
            onChange(pasteData)
            // 聚焦到最后一个有值的输入框
            const lastIndex = Math.min(pasteData.length - 1, length - 1)
            inputRefs.current[lastIndex]?.focus()
        }
    }

    // 处理点击
    const handleClick = (index: number) => {
        inputRefs.current[index]?.select()
        setFocusedIndex(index)
    }

    // 处理聚焦
    const handleFocus = (index: number) => {
        setFocusedIndex(index)
        inputRefs.current[index]?.select()
    }

    // 处理失焦
    const handleBlur = () => {
        setFocusedIndex(null)
    }

    return (
        <div className={cn("flex gap-2 justify-center", className)}>
            {Array.from({ length }, (_, index) => (
                <input
                    key={index}
                    ref={(el) => {
                        inputRefs.current[index] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={value[index] || ''}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    onClick={() => handleClick(index)}
                    onFocus={() => handleFocus(index)}
                    onBlur={handleBlur}
                    disabled={disabled}
                    className={cn(
                        "w-12 h-12 text-center text-lg font-semibold border-2 rounded-lg",
                        "bg-background text-foreground relative",
                        "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        "border-input-border", // Use the custom border class for better consistency
                        focusedIndex === index
                            ? "border-primary ring-2 ring-primary/20 z-[var(--z-modal)]"
                            : "hover:border-primary/50",
                        value[index] ? "border-primary bg-primary/5" : "",
                        "transition-colors duration-200"
                    )}
                    style={{
                        boxShadow: focusedIndex === index
                            ? '0 0 0 2px hsl(var(--primary) / 0.2)'
                            : undefined
                    }}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                />
            ))}
        </div>
    )
}
