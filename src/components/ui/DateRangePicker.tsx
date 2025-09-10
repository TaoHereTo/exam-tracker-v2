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
    // Initialize currentMonth to the 'from' date if available, otherwise to 'to' date or current date
    const [currentMonth, setCurrentMonth] = React.useState<Date | undefined>(() => {
        if (dateRange?.from) return dateRange.from
        if (dateRange?.to) return dateRange.to
        return new Date()
    })

    const fromTimestamp = dateRange?.from?.getTime();
    const toTimestamp = dateRange?.to?.getTime();

    React.useEffect(() => {
        // When external date changes, align month to the start date if available
        if (dateRange?.from) setCurrentMonth(dateRange.from)
        else if (dateRange?.to) setCurrentMonth(dateRange.to)
    }, [dateRange?.from, dateRange?.to, fromTimestamp, toTimestamp])

    const handleSelect = React.useCallback(
        (range: DateRange | undefined) => {
            // Update month to the start date to maintain proper view
            if (range?.from) setCurrentMonth(range.from)
            else if (range?.to) setCurrentMonth(range.to)
            onDateRangeChange?.(range)
        },
        [onDateRangeChange]
    )

    const handleOpenChange = React.useCallback((nextOpen: boolean) => {
        if (nextOpen) {
            // When opening, align month to the start date if available
            if (dateRange?.from) setCurrentMonth(dateRange.from)
            else if (dateRange?.to) setCurrentMonth(dateRange.to)
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
                        style={{
                            transition: 'none',
                            transform: 'none',
                            boxShadow: 'none'
                        }}
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