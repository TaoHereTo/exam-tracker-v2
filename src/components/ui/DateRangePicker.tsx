"use client"

import * as React from "react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { MixedText } from "./MixedText"

interface DateRangePickerProps {
    dateRange?: DateRange
    onDateRangeChange?: (range: DateRange | undefined) => void
    placeholder?: string
    className?: string
    disabled?: boolean
    error?: boolean
}

export function DateRangePicker({
    dateRange,
    onDateRangeChange,
    placeholder = "选择日期范围",
    className,
    disabled = false,
    error = false
}: DateRangePickerProps) {
    const [open, setOpen] = React.useState(false)
    const [currentMonth, setCurrentMonth] = React.useState<Date | undefined>(
        dateRange?.to ?? dateRange?.from
    )

    React.useEffect(() => {
        // 当外部传入的日期变化时，保持月份定位到已选择的末端（有 to 用 to，否则用 from）
        if (dateRange?.to) setCurrentMonth(dateRange.to)
        else if (dateRange?.from) setCurrentMonth(dateRange.from)
    }, [dateRange?.from?.getTime(), dateRange?.to?.getTime()])

    const handleSelect = React.useCallback(
        (range: DateRange | undefined) => {
            // 先更新月份再回调，保证界面定位不跳回默认月份
            if (range?.to) setCurrentMonth(range.to)
            else if (range?.from) setCurrentMonth(range.from)
            onDateRangeChange?.(range)
        },
        [onDateRangeChange]
    )
    
    const handleOpenChange = React.useCallback((nextOpen: boolean) => {
        if (nextOpen) {
            // 打开时将月份对齐到已选日期
            if (dateRange?.to) setCurrentMonth(dateRange.to)
            else if (dateRange?.from) setCurrentMonth(dateRange.from)
        }
        setOpen(nextOpen)
    }, [dateRange?.from, dateRange?.to])
    
    // Prevent popover from closing when interacting with calendar elements
    const handleCalendarInteraction = (e: React.MouseEvent | React.PointerEvent) => {
        e.stopPropagation()
    }
    
    // Handle month/year dropdown changes without closing the popover
    const handleMonthChange = React.useCallback((month: Date) => {
        setCurrentMonth(month)
    }, [])
    
    return (
        <div className={cn("grid gap-2", className)}>
            <Popover open={open} onOpenChange={handleOpenChange}>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant="outline"
                        className={cn(
                            "w-full justify-start text-left font-normal h-10",
                            !dateRange && "text-muted-foreground",
                            error && "border-destructive ring-destructive/20",
                            disabled && "opacity-50 cursor-not-allowed"
                        )}
                        disabled={disabled}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                            dateRange.to ? (
                                <>
                                    <MixedText text={format(dateRange.from, "yyyy-MM-dd")} />
                                    <MixedText text=" ~ " />
                                    <MixedText text={format(dateRange.to, "yyyy-MM-dd")} />
                                </>
                            ) : (
                                <MixedText text={format(dateRange.from, "yyyy-MM-dd")} />
                            )
                        ) : (
                            <MixedText text={placeholder} />
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent 
                    className="w-auto p-0 text-black dark:text-white" 
                    align="start"
                    onPointerDownOutside={(e) => {
                        // Prevent closing when interacting with dropdowns
                        const target = e.target as HTMLElement
                        if (target.closest('.rdp-dropdown_root') || target.closest('.rdp-dropdown')) {
                            e.preventDefault()
                        }
                    }}
                    onInteractOutside={(e) => {
                        // Prevent closing when interacting with dropdowns
                        const target = e.target as HTMLElement
                        if (target.closest('.rdp-dropdown_root') || target.closest('.rdp-dropdown')) {
                            e.preventDefault()
                        }
                    }}
                >
                    <div 
                        onClick={handleCalendarInteraction}
                        onPointerDown={handleCalendarInteraction}
                    >
                        <Calendar
                            initialFocus={false}
                            mode="range"
                            captionLayout="dropdown"
                            month={currentMonth}
                            onMonthChange={handleMonthChange}
                            selected={dateRange}
                            onSelect={handleSelect}
                            numberOfMonths={typeof window !== 'undefined' && window.innerWidth < 768 ? 1 : 2}
                            locale={zhCN}
                        />
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}