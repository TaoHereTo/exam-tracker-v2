"use client"

import React, { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { DateRange } from 'react-day-picker'

// 年份选择器组件
function YearPicker({
    selectedYear,
    onYearSelect,
    isOpen,
    onClose
}: {
    selectedYear: number
    onYearSelect: (year: number) => void
    isOpen: boolean
    onClose: () => void
}) {
    const currentYear = new Date().getFullYear()
    const startYear = 1900
    const endYear = 2100
    const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i)

    // 将年份分组为 4x4 网格
    const yearGroups = []
    for (let i = 0; i < years.length; i += 16) {
        yearGroups.push(years.slice(i, i + 16))
    }

    const currentGroupIndex = Math.floor((selectedYear - startYear) / 16)

    return (
        <div className="w-80 p-4">
            <div className="flex justify-center items-center mb-2 h-10 gap-1">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 p-0 flex items-center justify-center"
                    onClick={() => {
                        // 切换到上一组年份
                        const newIndex = Math.max(0, currentGroupIndex - 1)
                        const newYear = startYear + newIndex * 16
                        onYearSelect(newYear)
                    }}
                    disabled={currentGroupIndex === 0}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <span className="text-lg leading-none" style={{ transform: 'translateY(-2px)' }}>‹</span>
                </Button>

                <span className="text-sm font-medium h-10 flex items-center">
                    {startYear + currentGroupIndex * 16} - {Math.min(startYear + currentGroupIndex * 16 + 15, endYear)}
                </span>

                <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 p-0 flex items-center justify-center"
                    onClick={() => {
                        // 切换到下一组年份
                        const newIndex = Math.min(yearGroups.length - 1, currentGroupIndex + 1)
                        const newYear = startYear + newIndex * 16
                        onYearSelect(newYear)
                    }}
                    disabled={currentGroupIndex === yearGroups.length - 1}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <span className="text-lg leading-none" style={{ transform: 'translateY(-2px)' }}>›</span>
                </Button>
            </div>

            <div className="grid grid-cols-4 gap-2">
                {yearGroups[currentGroupIndex]?.map((year) => (
                    <Button
                        key={year}
                        variant={selectedYear === year ? "default" : "ghost"}
                        size="sm"
                        className="h-8 text-sm px-2"
                        onClick={() => {
                            onYearSelect(year)
                            // 不自动关闭，让用户可以继续选择
                        }}
                    >
                        {year}
                    </Button>
                ))}
            </div>
        </div>
    )
}

// 月份选择器组件
function MonthPicker({
    selectedMonth,
    onMonthSelect,
    isOpen,
    onClose
}: {
    selectedMonth: number
    onMonthSelect: (month: number) => void
    isOpen: boolean
    onClose: () => void
}) {
    const months = [
        { value: 0, label: '1月' },
        { value: 1, label: '2月' },
        { value: 2, label: '3月' },
        { value: 3, label: '4月' },
        { value: 4, label: '5月' },
        { value: 5, label: '6月' },
        { value: 6, label: '7月' },
        { value: 7, label: '8月' },
        { value: 8, label: '9月' },
        { value: 9, label: '10月' },
        { value: 10, label: '11月' },
        { value: 11, label: '12月' }
    ]

    return (
        <div className="w-80 p-4">
            <div className="grid grid-cols-3 gap-2">
                {months.map((month) => (
                    <Button
                        key={month.value}
                        variant={selectedMonth === month.value ? "default" : "ghost"}
                        size="sm"
                        className="h-8 text-sm px-2"
                        onClick={() => {
                            onMonthSelect(month.value)
                            onClose()
                        }}
                    >
                        {month.label}
                    </Button>
                ))}
            </div>
        </div>
    )
}

// 自定义日历组件（单个日期选择）
function CustomCalendar({
    selected,
    onSelect,
    themeColor = '#65a30d',
    page
}: {
    selected?: Date
    onSelect?: (date: Date | undefined) => void
    themeColor?: string
    page?: string
}) {
    const [currentYear, setCurrentYear] = useState(selected?.getFullYear() || new Date().getFullYear())
    const [currentMonthIndex, setCurrentMonthIndex] = useState(selected?.getMonth() || new Date().getMonth())
    const [showYearPicker, setShowYearPicker] = useState(false)
    const [showMonthPicker, setShowMonthPicker] = useState(false)

    const handleYearSelect = (year: number) => {
        setCurrentYear(year)
        // 不自动关闭年份选择器，让用户可以继续选择
    }

    const handleMonthSelect = (monthIndex: number) => {
        setCurrentMonthIndex(monthIndex)
        setShowMonthPicker(false)
    }

    const navigateMonth = (direction: 'prev' | 'next') => {
        if (direction === 'prev') {
            if (currentMonthIndex === 0) {
                setCurrentMonthIndex(11)
                setCurrentYear(currentYear - 1)
            } else {
                setCurrentMonthIndex(currentMonthIndex - 1)
            }
        } else {
            if (currentMonthIndex === 11) {
                setCurrentMonthIndex(0)
                setCurrentYear(currentYear + 1)
            } else {
                setCurrentMonthIndex(currentMonthIndex + 1)
            }
        }
    }

    const currentDate = new Date(currentYear, currentMonthIndex, 1)

    return (
        <div className="mx-auto">
            <div className="flex items-center justify-between px-3 py-3 h-12">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 flex items-center justify-center rounded-md"
                    onClick={() => navigateMonth('prev')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <span className="text-lg leading-none" style={{ transform: 'translateY(-1px)' }}>‹</span>
                </Button>

                <div className="flex items-center gap-0 h-10">
                    <Popover open={showYearPicker} onOpenChange={setShowYearPicker}>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="font-medium h-10 px-1 flex items-center justify-center hover:bg-accent hover:text-accent-foreground">
                                {currentYear}年
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <div className="p-4">
                                <p>年份选择器测试</p>
                                <YearPicker
                                    selectedYear={currentYear}
                                    onYearSelect={handleYearSelect}
                                    isOpen={showYearPicker}
                                    onClose={() => setShowYearPicker(false)}
                                />
                            </div>
                        </PopoverContent>
                    </Popover>

                    <Popover open={showMonthPicker} onOpenChange={setShowMonthPicker}>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="font-medium h-10 px-1 flex items-center justify-center hover:bg-accent hover:text-accent-foreground">
                                {currentMonthIndex + 1}月
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <MonthPicker
                                selectedMonth={currentMonthIndex}
                                onMonthSelect={handleMonthSelect}
                                isOpen={showMonthPicker}
                                onClose={() => setShowMonthPicker(false)}
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 flex items-center justify-center rounded-md"
                    onClick={() => navigateMonth('next')}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <span className="text-lg leading-none" style={{ transform: 'translateY(-1px)' }}>›</span>
                </Button>
            </div>

            <div>
                <Calendar
                    mode="single"
                    selected={selected}
                    onSelect={onSelect}
                    month={currentDate}
                    onMonthChange={(date) => {
                        setCurrentYear(date.getFullYear())
                        setCurrentMonthIndex(date.getMonth())
                    }}
                    locale={zhCN}
                    page={page}
                    captionLayout="label"
                    showCustomHeader={false}
                />
            </div>
        </div>
    )
}

// 自定义日期范围选择器组件
function CustomDateRangePicker({
    dateRange,
    onDateRangeChange,
    placeholder = "选择日期范围",
    themeColor = '#65a30d',
    page
}: {
    dateRange?: DateRange
    onDateRangeChange?: (range: DateRange | undefined) => void
    placeholder?: string
    themeColor?: string
    page?: string
}) {

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                        dateRange.to ? (
                            <>
                                {format(dateRange.from, 'yyyy年MM月dd日', { locale: zhCN })} -{' '}
                                {format(dateRange.to, 'yyyy年MM月dd日', { locale: zhCN })}
                            </>
                        ) : (
                            format(dateRange.from, 'yyyy年MM月dd日', { locale: zhCN })
                        )
                    ) : (
                        <span>{placeholder}</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={onDateRangeChange}
                    numberOfMonths={2}
                    locale={zhCN}
                    page={page}
                    captionLayout="label"
                    showCustomHeader={false}
                />
            </PopoverContent>
        </Popover>
    )
}

export { CustomCalendar, CustomDateRangePicker }
