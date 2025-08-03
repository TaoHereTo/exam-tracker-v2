"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { AnimatedList } from "./animated-list";
import { CheckCircle2, XCircle, Info, AlertTriangle } from "lucide-react";
import { MixedText } from "@/components/ui/MixedText";

export type NotificationType = "success" | "error" | "info" | "warning";

export interface Notification {
    id: string;
    type: NotificationType;
    message: string;
    description?: string;
}

interface NotificationContextProps {
    notify: (n: Omit<Notification, "id">) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const useNotification = () => {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error("useNotification must be used within NotificationProvider");
    return ctx;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const timerRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

    const remove = useCallback((id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        if (timerRef.current[id]) {
            clearTimeout(timerRef.current[id]);
            delete timerRef.current[id];
        }
    }, []);

    const notify = useCallback((n: Omit<Notification, "id">) => {
        const id = Date.now().toString() + Math.random().toString(16).slice(2);
        setNotifications((prev) => [{ ...n, id }, ...prev]);
        timerRef.current[id] = setTimeout(() => remove(id), 3000);
    }, [remove]);

    return (
        <NotificationContext.Provider value={{ notify }}>
            {children}
            <div className="fixed top-6 right-6 z-[99999] w-[320px] max-w-full pointer-events-none">
                <AnimatedList delay={200} className="items-end">
                    {notifications.map((n) => (
                        <div
                            key={n.id}
                            className={`shadow-lg rounded-lg px-4 py-3 mb-2 bg-white dark:bg-gray-900 flex items-start gap-3 transition-all
              `}
                            style={{ minWidth: 240 }}
                        >
                            <span className="mt-0.5">
                                {n.type === "success" && <CheckCircle2 className="text-green-500 w-5 h-5" />}
                                {n.type === "error" && <XCircle className="text-red-500 w-5 h-5" />}
                                {n.type === "warning" && <AlertTriangle className="text-yellow-500 w-5 h-5" />}
                                {n.type === "info" && <Info className="text-blue-500 w-5 h-5" />}
                            </span>
                            <div>
                                <div className="font-semibold text-base notification-message">
                                    <MixedText text={n.message} />
                                </div>
                                {n.description && (
                                    <div className="text-xs text-gray-500 mt-1 notification-description"><MixedText text={n.description} /></div>
                                )}
                            </div>
                        </div>
                    ))}
                </AnimatedList>
            </div>
        </NotificationContext.Provider>
    );
}; 