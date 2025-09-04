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
        console.log('Audio not supported or blocked');
    }
};

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
        const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setNotifications((prev) => [{ ...n, id }, ...prev]);
        timerRef.current[id] = setTimeout(() => remove(id), 5000);
        
        // Play sound when notification appears
        playNotificationSound(n.type);
    }, [remove]);

    return (
        <NotificationContext.Provider value={{ notify }}>
            {children}
            <div className="fixed top-6 right-6 z-[99999] w-[320px] max-w-full pointer-events-none">
                <AnimatedList delay={200} className="items-end">
                    {notifications.map((n) => (
                        <div
                            key={n.id}
                            className={`shadow-lg rounded-lg px-4 py-3 mb-2 flex items-start gap-3 transition-all
              `}
                            style={{ minWidth: 240, backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}
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