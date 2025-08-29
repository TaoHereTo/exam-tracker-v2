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
    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
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
                <PopoverContent className="w-auto p-0 text-black dark:text-white" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        captionLayout="dropdown"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={onDateRangeChange}
                        numberOfMonths={typeof window !== 'undefined' && window.innerWidth < 768 ? 1 : 2}
                        locale={zhCN}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}