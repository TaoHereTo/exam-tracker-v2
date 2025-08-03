import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { UsernameService, type UsernameCheckResult } from '@/lib/usernameService';
import { cn } from '@/lib/utils';
import { MixedText } from './MixedText';

interface UsernameCheckerProps {
    value: string;
    onChange: (value: string) => void;
    onValidationChange?: (isValid: boolean) => void;
    className?: string;
    placeholder?: string;
    label?: string;
    disabled?: boolean;
    showSuggestions?: boolean;
    userEmail?: string; // 添加用户邮箱参数
}

export function UsernameChecker({
    value,
    onChange,
    onValidationChange,
    className,
    placeholder = "请输入用户名",
    label = "用户名",
    disabled = false,
    showSuggestions = true,
    userEmail
}: UsernameCheckerProps) {
    const [checkResult, setCheckResult] = useState<UsernameCheckResult | null>(null);
    const [isChecking, setIsChecking] = useState(false);
    const [hasChecked, setHasChecked] = useState(false);

    // 防抖检查用户名
    const debouncedCheck = useCallback(
        (username: string) => {
            const timeoutId = setTimeout(async () => {
                if (!username || username.length < 3) {
                    setCheckResult(null);
                    setHasChecked(false);
                    onValidationChange?.(false);
                    return;
                }

                setIsChecking(true);
                try {
                    const result = await UsernameService.checkUsernameAvailability(username, userEmail);
                    setCheckResult(result);
                    setHasChecked(true);
                    onValidationChange?.(result.available);
                } catch (error) {
                    console.error('检查用户名时出错:', error);
                    setCheckResult({
                        available: false,
                        message: '检查用户名时出错，请稍后重试'
                    });
                    setHasChecked(true);
                    onValidationChange?.(false);
                } finally {
                    setIsChecking(false);
                }
            }, 500);

            return () => clearTimeout(timeoutId);
        },
        [onValidationChange, userEmail]
    );

    // 当用户名变化时检查
    useEffect(() => {
        const cleanup = debouncedCheck(value);
        return cleanup;
    }, [value, debouncedCheck]);

    // 获取状态样式
    const getStatusStyle = () => {
        if (!hasChecked || !value || value.length < 3) {
            return 'border-gray-300';
        }
        if (isChecking) {
            return 'border-blue-300';
        }
        if (checkResult?.available) {
            return 'border-green-300 focus:border-green-500';
        }
        return 'border-red-300 focus:border-red-500';
    };

    // 获取状态图标
    const getStatusIcon = () => {
        if (!hasChecked || !value || value.length < 3) {
            return null;
        }
        if (isChecking) {
            return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
        }
        if (checkResult?.available) {
            return <CheckCircle className="h-4 w-4 text-green-500" />;
        }
        return <XCircle className="h-4 w-4 text-red-500" />;
    };

    // 获取状态消息
    const getStatusMessage = () => {
        if (!value) {
            return null;
        }
        if (value.length < 3) {
            return <span className="text-yellow-600 text-sm"><MixedText text="用户名至少需要3个字符" /></span>;
        }
        if (isChecking) {
            return <span className="text-blue-600 text-sm"><MixedText text="正在检查用户名..." /></span>;
        }
        if (checkResult) {
            return (
                <span className={cn(
                    "text-sm",
                    checkResult.available ? "text-green-600" : "text-red-600"
                )}>
                    <MixedText text={checkResult.message} />
                </span>
            );
        }
        return null;
    };

    // 获取用户名建议
    const getSuggestions = () => {
        if (!showSuggestions || !checkResult || checkResult.available || !value) {
            return [];
        }
        return UsernameService.getUsernameSuggestions(value);
    };

    const suggestions = getSuggestions();

    return (
        <div className={cn("space-y-2", className)}>
            <Label htmlFor="username">{typeof label === 'string' ? <MixedText text={label} /> : label}</Label>
            <div className="relative">
                <Input
                    id="username"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={cn(
                        "pr-10",
                        getStatusStyle()
                    )}
                    maxLength={20}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {getStatusIcon()}
                </div>
            </div>

            {/* 状态消息 */}
            {getStatusMessage() && (
                <div className="flex items-center gap-2">
                    {getStatusMessage()}
                </div>
            )}

            {/* 用户名建议 */}
            {suggestions.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-500" />
                        <span className="text-sm text-blue-600"><MixedText text="建议的用户名：" /></span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {suggestions.map((suggestion, index) => (
                            <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => onChange(suggestion)}
                                className="text-xs"
                            >
                                <MixedText text={suggestion} />
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            {/* 管理员用户名提示 */}
            {UsernameService.isAdminUsername(value, userEmail) && (
                <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-700">
                        <MixedText text="检测到管理员用户名，请确保您有相应的权限" />
                    </span>
                </div>
            )}
        </div>
    );
}

