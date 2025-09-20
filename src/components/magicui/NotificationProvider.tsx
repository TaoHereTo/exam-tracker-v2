"use client";

import React, { createContext, useContext, useCallback, useState, useEffect } from "react";
import toast, { Toaster, ToastBar } from "react-hot-toast";
import { CheckCircle2, XCircle, Info, AlertTriangle, Flower } from "lucide-react";
import { MixedText } from "@/components/ui/MixedText";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/components/animate-ui/components/radix/sidebar";

// 自定义hook来安全地使用useSidebar
function useSidebarSafe() {
    try {
        return useSidebar();
    } catch {
        return { state: 'collapsed' as const, open: false };
    }
}

export type NotificationType = "success" | "error" | "info" | "warning";

export interface Notification {
    id?: string;
    type: NotificationType;
    message: string;
    description?: string;
    icon?: string;
}

interface NotificationContextProps {
    notify: (n: Omit<Notification, "id">) => void;
    notifyLoading?: (message: string, description?: string) => string;
    updateToSuccess?: (id: string, message: string, description?: string) => void;
    updateToError?: (id: string, message: string, description?: string) => void;
}

// Type definition for webkitAudioContext
interface WebkitAudioContext extends AudioContext {
    webkitAudioContext: typeof AudioContext;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

// Function to play sound based on notification type
const playNotificationSound = (type: NotificationType) => {
    try {
        // Create audio context
        const AudioContextConstructor = window.AudioContext || (window as unknown as WebkitAudioContext).webkitAudioContext;
        const audioContext = new AudioContextConstructor();

        // Create oscillator and gain node
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Set frequency and duration based on notification type
        switch (type) {
            case "success":
                // Higher pitch for success
                oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
                break;
            case "error":
                // Lower pitch for error with two tones
                oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.15);

                // Second tone
                const oscillator2 = audioContext.createOscillator();
                const gainNode2 = audioContext.createGain();
                oscillator2.connect(gainNode2);
                gainNode2.connect(audioContext.destination);
                oscillator2.frequency.setValueAtTime(180, audioContext.currentTime + 0.2);
                gainNode2.gain.setValueAtTime(0.1, audioContext.currentTime + 0.2);
                gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.35);
                oscillator2.start(audioContext.currentTime + 0.2);
                oscillator2.stop(audioContext.currentTime + 0.35);
                break;
            case "warning":
                // Medium pitch for warning with vibrato
                oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
                // Add vibrato effect
                oscillator.frequency.setValueAtTime(460, audioContext.currentTime + 0.05);
                oscillator.frequency.setValueAtTime(440, audioContext.currentTime + 0.1);
                oscillator.frequency.setValueAtTime(420, audioContext.currentTime + 0.15);
                oscillator.frequency.setValueAtTime(440, audioContext.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.4);
                break;
            case "info":
                // Soft beep for info
                oscillator.frequency.setValueAtTime(660, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.07, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);
                break;
        }
    } catch (error) {
        // Audio not supported or blocked, silently fail
    }
};

// Function to get the appropriate icon based on type or custom icon
const getIcon = (notification: Notification) => {
    // If a custom icon is specified and it's "flower", use the Flower icon
    if (notification.icon === "flower") {
        return <Flower className="text-green-500 w-5 h-5 unselectable" />;
    }

    // Otherwise, use the default icons based on type
    switch (notification.type) {
        case "success":
            return <CheckCircle2 className="text-green-500 w-5 h-5 unselectable" />;
        case "error":
            return <XCircle className="text-red-500 w-5 h-5 unselectable" />;
        case "warning":
            return <AlertTriangle className="text-yellow-500 w-5 h-5 unselectable" />;
        case "info":
        default:
            return <Info className="text-blue-500 w-5 h-5 unselectable" />;
    }
};

// Custom Toast Content Component
const ToastContent = ({ notification, showIcon }: { notification: Notification; showIcon?: boolean }) => {
    // Only show custom icons for warning and info notifications
    // Success and error notifications use react-hot-toast's built-in icons
    const shouldShowIcon = showIcon !== false && (notification.type === "warning" || notification.type === "info" || notification.icon === "flower");
    const icon = shouldShowIcon ? getIcon(notification) : null;

    return (
        <div className="flex items-start gap-1.5 unselectable">
            {icon && (
                <span className="mt-0.5 flex-shrink-0 unselectable">
                    {icon}
                </span>
            )}
            <div className="unselectable">
                <div className="font-semibold text-base notification-message text-foreground dark:text-white unselectable">
                    <MixedText text={notification.message} />
                </div>
                {notification.description && (
                    <div className="text-xs text-gray-500 mt-1 notification-description dark:text-gray-300 unselectable">
                        <MixedText text={notification.description} />
                    </div>
                )}
            </div>
        </div>
    );
};

export const useNotification = () => {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error("useNotification must be used within NotificationProvider");
    return ctx;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const pathname = usePathname();

    // 获取侧边栏状态，如果不在侧边栏上下文中则默认为收起状态
    const sidebarState = useSidebarSafe();

    // 判断是否为认证页面
    const isAuthPage = pathname === '/auth';

    // 统一使用右下角位置
    const getToastPosition = () => {
        return "bottom-right" as const;
    };

    const getContainerStyle = () => {
        // 所有页面都使用右下角位置
        return {
            position: 'fixed' as const,
            bottom: '20px',
            right: '20px',
            zIndex: 9999,
            width: 'auto',
            maxWidth: 'calc(100vw - 40px)',
        };
    };

    const notify = useCallback((n: Omit<Notification, "id">) => {
        // Play sound when notification appears
        playNotificationSound(n.type);

        // Create toast based on type
        const toastOptions = {
            position: getToastPosition(),
            duration: 5000,
            style: {
                background: 'var(--popover)',
                border: '1px solid var(--border)',
                minWidth: '200px',
                maxWidth: '280px',
                padding: '8px 12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            },
        };

        switch (n.type) {
            case "success":
                toast.success(<ToastContent notification={n} showIcon={false} />, toastOptions);
                break;
            case "error":
                toast.error(<ToastContent notification={n} showIcon={false} />, toastOptions);
                break;
            case "warning":
                toast(<ToastContent notification={n} />, {
                    ...toastOptions,
                    icon: getIcon(n)
                });
                break;
            case "info":
            default:
                toast(<ToastContent notification={n} />, {
                    ...toastOptions,
                    icon: getIcon(n)
                });
                break;
        }
    }, []);

    // New function for loading notifications that can transition to success/error
    const notifyLoading = useCallback((message: string, description?: string) => {
        const id = toast.loading(
            <div className="flex items-start gap-1.5 unselectable">
                <div className="font-semibold text-base notification-message text-foreground dark:text-white unselectable">
                    <MixedText text={message} />
                </div>
            </div>,
            {
                position: getToastPosition(),
                style: {
                    background: 'var(--popover)',
                    border: '1px solid var(--border)',
                    minWidth: '200px',
                    maxWidth: '280px',
                    padding: '8px 12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                },
            }
        );
        return id;
    }, []);

    // New function to update a loading notification to success
    const updateToSuccess = useCallback((id: string, message: string, description?: string) => {
        toast.success(
            <div className="flex items-start gap-1.5 unselectable">
                <div className="font-semibold text-base notification-message text-foreground dark:text-white unselectable">
                    <MixedText text={message} />
                </div>
            </div>,
            {
                id,
                position: getToastPosition(),
                style: {
                    background: 'var(--popover)',
                    border: '1px solid var(--border)',
                    minWidth: '200px',
                    maxWidth: '280px',
                    padding: '8px 12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                },
            }
        );
    }, []);

    // New function to update a loading notification to error
    const updateToError = useCallback((id: string, message: string, description?: string) => {
        toast.error(
            <div className="flex items-start gap-1.5 unselectable">
                <div className="font-semibold text-base notification-message text-foreground dark:text-white unselectable">
                    <MixedText text={message} />
                </div>
            </div>,
            {
                id,
                position: getToastPosition(),
                style: {
                    background: 'var(--popover)',
                    border: '1px solid var(--border)',
                    minWidth: '200px',
                    maxWidth: '280px',
                    padding: '8px 12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                },
            }
        );
    }, []);

    return (
        <NotificationContext.Provider value={{ notify, notifyLoading, updateToSuccess, updateToError }}>
            {children}
            <Toaster
                position={getToastPosition()}
                toastOptions={{
                    duration: 5000,
                    style: {
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                        minWidth: '200px',
                        maxWidth: '280px',
                        padding: '8px 12px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    },
                }}
                containerStyle={getContainerStyle()}
            >
                {(t) => (
                    <ToastBar
                        toast={t}
                        style={{
                            ...t.style,
                            animation: t.visible
                                ? 'toast-enter 0.3s cubic-bezier(0.21, 1.02, 0.73, 1) forwards'
                                : 'toast-exit 0.3s cubic-bezier(0.06, 0.71, 0.57, 1) forwards',
                        }}
                    />
                )}
            </Toaster>
        </NotificationContext.Provider>
    );
};