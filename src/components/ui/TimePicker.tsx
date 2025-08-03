"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MixedText } from './MixedText';

interface TimePickerProps {
    value?: string; // 格式: "MM:SS"
    onChange?: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export const TimePicker: React.FC<TimePickerProps> = ({
    value = '',
    onChange,
    placeholder = "选择时间",
    className = '',
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [minutes, setMinutes] = useState(0);
    const [seconds, setSeconds] = useState(0);

    // 解析初始值
    useEffect(() => {
        if (value) {
            const [mins, secs] = value.split(':').map(Number);
            setMinutes(mins || 0);
            setSeconds(secs || 0);
        } else {
            setMinutes(0);
            setSeconds(0);
        }
    }, [value]);

    // 格式化显示值
    const displayValue = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // 处理分钟变化
    const handleMinutesChange = (newMinutes: number) => {
        const clampedMinutes = Math.max(0, Math.min(999, newMinutes));
        setMinutes(clampedMinutes);
        const newValue = `${String(clampedMinutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        onChange?.(newValue);
    };

    // 处理秒钟变化
    const handleSecondsChange = (newSeconds: number) => {
        const clampedSeconds = Math.max(0, Math.min(59, newSeconds));
        setSeconds(clampedSeconds);
        const newValue = `${String(minutes).padStart(2, '0')}:${String(clampedSeconds).padStart(2, '0')}`;
        onChange?.(newValue);
    };

    // 处理输入框变化
    const handleInputChange = (type: 'minutes' | 'seconds', inputValue: string) => {
        const numValue = parseInt(inputValue) || 0;
        if (type === 'minutes') {
            const clampedMinutes = Math.max(0, Math.min(999, numValue));
            setMinutes(clampedMinutes);
        } else {
            const clampedSeconds = Math.max(0, Math.min(59, numValue));
            setSeconds(clampedSeconds);
        }
    };

    // 确认选择
    const handleConfirm = () => {
        const newValue = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        onChange?.(newValue);
        setIsOpen(false);
    };

    // 处理键盘事件
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleConfirm();
        }
    };

    // 重置
    const handleReset = () => {
        setMinutes(0);
        setSeconds(0);
        onChange?.('00:00');
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !value && "text-muted-foreground",
                        className
                    )}
                    disabled={disabled}
                >
                    <Clock className="mr-2 h-4 w-4" />
                    {value ? displayValue : <MixedText text={placeholder} />}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="start">
                <div className="space-y-4" onKeyDown={handleKeyDown}>
                    <div className="text-center">
                        <div className="text-2xl font-mono text-center py-2">
                            {displayValue}
                        </div>
                    </div>

                    <div className="flex items-center justify-center space-x-4">
                        {/* 分钟选择 */}
                        <div className="text-center">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                <MixedText text="分钟" />
                            </label>
                            <Input
                                type="number"
                                value={minutes}
                                onChange={(e) => handleInputChange('minutes', e.target.value)}
                                className="w-20 text-center"
                                min="0"
                                max="999"
                            />
                        </div>

                        <div className="text-2xl font-mono text-gray-400">:</div>

                        {/* 秒钟选择 */}
                        <div className="text-center">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                <MixedText text="秒钟" />
                            </label>
                            <Input
                                type="number"
                                value={seconds}
                                onChange={(e) => handleInputChange('seconds', e.target.value)}
                                className="w-20 text-center"
                                min="0"
                                max="59"
                            />
                        </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex justify-between pt-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleReset}
                        >
                            <MixedText text="重置" />
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleConfirm}
                        >
                            <MixedText text="确认" />
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}; 