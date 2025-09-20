import * as React from "react"
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronsLeftIcon,
    ChevronsRightIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/animate-ui/components/animate/tooltip"
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/animate-ui/components/radix/hover-card"
import { MODULES, normalizeModuleName } from "@/config/exam"
import type { RecordItem, KnowledgeItem } from "@/types/record"

interface BeautifulPaginationProps {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
    className?: string
    showPageInfo?: boolean
    totalItems?: number
    records?: RecordItem[]
    knowledge?: KnowledgeItem[]
    showModuleStats?: boolean
}

export function BeautifulPagination({
    currentPage,
    totalPages,
    onPageChange,
    className,
    showPageInfo = true,
    totalItems,
    records = [],
    knowledge = [],
    showModuleStats = false,
}: BeautifulPaginationProps) {
    const canGoPrevious = currentPage > 1
    const canGoNext = currentPage < totalPages

    // Calculate module counts for records
    const recordModuleCounts = React.useMemo(() => {
        if (!showModuleStats || !records.length) return {}

        const counts: Record<string, number> = {}
        records.forEach(record => {
            const normalizedModule = normalizeModuleName(record.module)
            counts[normalizedModule] = (counts[normalizedModule] || 0) + 1
        })
        return counts
    }, [records, showModuleStats])

    // Calculate module counts for knowledge
    const knowledgeModuleCounts = React.useMemo(() => {
        if (!showModuleStats || !knowledge.length) return {}

        const counts: Record<string, number> = {}
        knowledge.forEach(item => {
            const normalizedModule = normalizeModuleName(item.module)
            counts[normalizedModule] = (counts[normalizedModule] || 0) + 1
        })
        return counts
    }, [knowledge, showModuleStats])

    const handlePrevious = () => {
        if (canGoPrevious) {
            onPageChange(currentPage - 1)
        }
    }

    const handleNext = () => {
        if (canGoNext) {
            onPageChange(currentPage + 1)
        }
    }

    const handleFirst = () => {
        onPageChange(1)
    }

    const handleLast = () => {
        onPageChange(totalPages)
    }

    // Render pagination info with optional hover card
    const renderPaginationInfo = () => {
        const pageInfoText = totalItems !== undefined ? (
            <>第 {currentPage} 页，共 {totalPages} 页，总计 {totalItems} 条记录</>
        ) : (
            <>第 {currentPage} 页，共 {totalPages} 页</>
        )

        if (!showModuleStats) {
            return (
                <div className="text-sm font-semibold text-muted-foreground hover:underline">
                    {pageInfoText}
                </div>
            )
        }

        return (
            <HoverCard>
                <HoverCardTrigger asChild>
                    <div className="text-sm font-semibold text-muted-foreground cursor-pointer hover:underline">
                        {pageInfoText}
                    </div>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold">
                            {knowledge.length > 0 ? "各模块知识点统计" : "各模块刷题记录统计"}
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                            {MODULES.map(module => (
                                <div key={module.value} className="flex justify-between text-sm">
                                    <span>{module.label}:</span>
                                    <span className="font-medium">
                                        {knowledge.length > 0
                                            ? (knowledgeModuleCounts[module.label] || 0)
                                            : (recordModuleCounts[module.label] || 0)} 条
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </HoverCardContent>
            </HoverCard>
        )
    }

    return (
        <div className={cn("flex items-center justify-end gap-4 w-full", className)}>
            {/* 页码信息 */}
            {showPageInfo && renderPaginationInfo()}

            {/* 分页按钮组 */}
            <TooltipProvider>
                <div className="flex items-center gap-2">
                    {/* 第一页按钮 */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleFirst}
                                disabled={!canGoPrevious}
                                className="h-8 w-8 p-0"
                                aria-label="Go to first page"
                            >
                                <ChevronsLeftIcon className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>第一页</p>
                        </TooltipContent>
                    </Tooltip>

                    {/* 上一页按钮 */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handlePrevious}
                                disabled={!canGoPrevious}
                                className="h-8 w-8 p-0"
                                aria-label="Go to previous page"
                            >
                                <ChevronLeftIcon className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>上一页</p>
                        </TooltipContent>
                    </Tooltip>

                    {/* 下一页按钮 */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleNext}
                                disabled={!canGoNext}
                                className="h-8 w-8 p-0"
                                aria-label="Go to next page"
                            >
                                <ChevronRightIcon className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>下一页</p>
                        </TooltipContent>
                    </Tooltip>

                    {/* 最后一页按钮 */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleLast}
                                disabled={!canGoNext}
                                className="h-8 w-8 p-0"
                                aria-label="Go to last page"
                            >
                                <ChevronsRightIcon className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>最后一页</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </TooltipProvider>
        </div>
    )
}