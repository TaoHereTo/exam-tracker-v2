"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { format } from "date-fns";
import { Clock, Edit, Trash2, Pin, PinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CircularButton } from "@/components/ui/circular-button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/animate-ui/components/animate/tooltip";

interface ExamCountdown {
    id: string;
    name: string;
    examDate: string;
    description?: string;
    isPinned?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

interface CountdownExpandableCardProps {
    countdowns: ExamCountdown[];
    calculateDetailedCountdown: (examDate: string) => React.ReactNode;
    getExamPhase: (examDate: string) => string;
    getStatusDisplay: (examDate: string) => { text: string; color: string };
    prefix?: string;
    onEdit?: (countdown: ExamCountdown) => void;
    onDelete?: (id: string) => void;
    onTogglePin?: (countdown: ExamCountdown) => void;
}

export default function CountdownExpandableCard({
    countdowns,
    calculateDetailedCountdown,
    getExamPhase,
    getStatusDisplay,
    prefix = "",
    onEdit,
    onDelete,
    onTogglePin
}: CountdownExpandableCardProps) {
    const [active, setActive] = useState<ExamCountdown | boolean | null>(null);
    const ref = useRef<HTMLDivElement>(null);
    const id = useId();
    // 使用 prefix 和 id 组合确保唯一性
    const uniqueId = `${prefix}-${id}`;


    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setActive(null);
            }
        }

        if (active && typeof active === "object") {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [active]);

    useOutsideClick(ref, () => setActive(null));

    return (
        <>
            <AnimatePresence>
                {active && typeof active === "object" && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/20 h-full w-full z-[999]"
                        style={{ pointerEvents: 'auto' }}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {active && typeof active === "object" ? (
                    <div key={`modal-${active.id}-${uniqueId}`} className="fixed inset-0 grid place-items-center z-[1000]">
                        <motion.button
                            key={`close-button-${active.id}-${uniqueId}`}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{
                                opacity: 0,
                                transition: { duration: 0.05 }
                            }}
                            className="flex absolute top-2 right-2 lg:hidden items-center justify-center bg-white dark:bg-neutral-900 rounded-full h-6 w-6"
                            onClick={() => setActive(null)}
                        >
                            <CloseIcon />
                        </motion.button>
                        <motion.div
                            layoutId={`card-${prefix}-${active.id}-${uniqueId}`}
                            ref={ref}
                            className="w-full max-w-[500px] h-full md:h-fit md:max-h-[90%] flex flex-col bg-white dark:bg-black sm:rounded-3xl overflow-hidden border border-border shadow-lg"
                        >
                            <div>
                                <div className="flex justify-between items-start p-4">
                                    <div className="">
                                        <h3 className="font-bold text-foreground">
                                            {active.name}
                                        </h3>
                                        <p className="text-muted-foreground">
                                            {active.description || '暂无描述'}
                                        </p>
                                    </div>

                                    <div className="flex gap-1">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-full"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onTogglePin?.(active);
                                                        }}
                                                        style={{
                                                            backgroundColor: active.isPinned ? '#f59e0b' : '#6b7280',
                                                            borderColor: active.isPinned ? '#f59e0b' : '#6b7280'
                                                        }}
                                                    >
                                                        {active.isPinned ? <Pin className="w-4 h-4 text-white" /> : <PinOff className="w-4 h-4 text-white" />}
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent className="z-[1001]">
                                                    <p>{active.isPinned ? '取消置顶' : '置顶'}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <motion.div
                                                        layoutId={`button-${prefix}-${active.id}-${uniqueId}`}
                                                    >
                                                        <CircularButton
                                                            variant="success"
                                                            size="default"
                                                            onClick={() => {
                                                                onEdit?.(active);
                                                                setActive(null);
                                                            }}
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </CircularButton>
                                                    </motion.div>
                                                </TooltipTrigger>
                                                <TooltipContent className="z-[1001]">
                                                    <p>编辑倒计时</p>
                                                </TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <CircularButton
                                                        variant="destructive"
                                                        size="default"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDelete?.(active.id);
                                                            // 不立即关闭展开状态，让确认弹窗先显示
                                                        }}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </CircularButton>
                                                </TooltipTrigger>
                                                <TooltipContent className="z-[1001]">
                                                    <p>删除倒计时</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                </div>
                                <div className="pt-4 relative px-4">
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="text-neutral-700 text-xs md:text-sm lg:text-base h-40 md:h-fit pb-10 flex flex-col items-center gap-4 overflow-auto dark:text-neutral-300 [mask:linear-gradient(to_bottom,white,white,transparent)] [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-overflow-scrolling:touch]"
                                    >
                                        <div className="space-y-4 flex flex-col items-center">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                                                    {getExamPhase(active.examDate)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                                                    {format(new Date(active.examDate), 'yyyy年MM月dd日 HH:mm')}
                                                </span>
                                            </div>
                                            <div className="mt-4">
                                                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col items-center text-center">
                                                    {calculateDetailedCountdown(active.examDate)}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                ) : null}
            </AnimatePresence>
            <ul className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 grid-md">
                <AnimatePresence mode="popLayout">
                    {countdowns.map((countdown) => {
                        const statusDisplay = getStatusDisplay(countdown.examDate);
                        const isActive = active && typeof active === "object" && active.id === countdown.id;

                        return (
                            <motion.div
                                layoutId={`card-${prefix}-${countdown.id}-${uniqueId}`}
                                key={`card-${prefix}-${countdown.id}-${uniqueId}`}
                                onClick={() => setActive(countdown)}
                                className="p-card flex flex-col bg-white dark:bg-black hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl cursor-pointer border border-neutral-200 dark:border-neutral-700 shadow-none hover:shadow-none transition-shadow"
                                style={{
                                    display: isActive ? 'none' : 'block'
                                }}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <h3 className="font-medium text-black dark:text-white text-left">
                                            {countdown.name}
                                        </h3>
                                    </div>
                                    <div className="flex gap-1 ml-2 flex-shrink-0">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-full"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onTogglePin?.(countdown);
                                                        }}
                                                        style={{
                                                            backgroundColor: countdown.isPinned ? '#f59e0b' : '#6b7280',
                                                            borderColor: countdown.isPinned ? '#f59e0b' : '#6b7280'
                                                        }}
                                                    >
                                                        {countdown.isPinned ? <Pin className="w-4 h-4 text-white" /> : <PinOff className="w-4 h-4 text-white" />}
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{countdown.isPinned ? '取消置顶' : '置顶'}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <motion.div
                                                        layoutId={`button-${prefix}-${countdown.id}-${uniqueId}`}
                                                    >
                                                        <CircularButton
                                                            variant="success"
                                                            size="default"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onEdit?.(countdown);
                                                            }}
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </CircularButton>
                                                    </motion.div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>编辑倒计时</p>
                                                </TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <CircularButton
                                                        variant="destructive"
                                                        size="default"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDelete?.(countdown.id);
                                                        }}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </CircularButton>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>删除倒计时</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                </div>

                                {/* 倒计时显示区域 */}
                                <div className="mb-3">
                                    {calculateDetailedCountdown(countdown.examDate)}
                                </div>

                                {/* 状态信息 */}
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: statusDisplay.color }}
                                    />
                                    <span
                                        className="text-xs font-medium"
                                        style={{ color: statusDisplay.color }}
                                    >
                                        {getExamPhase(countdown.examDate)}
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </ul>
        </>
    );
}

export const CloseIcon = () => {
    return (
        <motion.svg
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{
                opacity: 0,
                transition: { duration: 0.05 }
            }}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 text-black dark:text-white"
        >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M18 6l-12 12" />
            <path d="M6 6l12 12" />
        </motion.svg>
    );
};