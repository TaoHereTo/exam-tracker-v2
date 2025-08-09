import * as React from "react"
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronsLeftIcon,
    ChevronsRightIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface BeautifulPaginationProps {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
    className?: string
    showPageInfo?: boolean
}

export function BeautifulPagination({
    currentPage,
    totalPages,
    onPageChange,
    className,
    showPageInfo = true,
}: BeautifulPaginationProps) {
    const canGoPrevious = currentPage > 1
    const canGoNext = currentPage < totalPages

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



    return (
        <div className={cn("flex items-center justify-end gap-4 w-full", className)}>
            {/* 页码信息 */}
            {showPageInfo && (
                <div className="text-sm font-semibold text-muted-foreground">
                    第 {currentPage} 页，共 {totalPages} 页
                </div>
            )}

            {/* 分页按钮组 */}
            <div className="flex items-center gap-2">
                {/* 第一页按钮 */}
                <Button
                    variant="pagination"
                    size="icon"
                    onClick={handleFirst}
                    disabled={!canGoPrevious}
                    className="h-8 w-8 p-0"
                    aria-label="Go to first page"
                >
                    <ChevronsLeftIcon className="h-4 w-4" />
                </Button>

                {/* 上一页按钮 */}
                <Button
                    variant="pagination"
                    size="icon"
                    onClick={handlePrevious}
                    disabled={!canGoPrevious}
                    className="h-8 w-8 p-0"
                    aria-label="Go to previous page"
                >
                    <ChevronLeftIcon className="h-4 w-4" />
                </Button>

                {/* 下一页按钮 */}
                <Button
                    variant="pagination"
                    size="icon"
                    onClick={handleNext}
                    disabled={!canGoNext}
                    className="h-8 w-8 p-0"
                    aria-label="Go to next page"
                >
                    <ChevronRightIcon className="h-4 w-4" />
                </Button>

                {/* 最后一页按钮 */}
                <Button
                    variant="pagination"
                    size="icon"
                    onClick={handleLast}
                    disabled={!canGoNext}
                    className="h-8 w-8 p-0"
                    aria-label="Go to last page"
                >
                    <ChevronsRightIcon className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}

