"use client"

import React, { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
                <span className="text-sm font-medium flex items-center justify-center h-10">
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
                        className="h-8 text-xs"
                        onClick={() => {
                            onYearSelect(year)
                            onClose()
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
        { value: 11, label: '12月' },
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

// 自定义日历组件
function CustomCalendar({
    selected,
    onSelect
}: {
    selected?: Date
    onSelect?: (date: Date | undefined) => void
}) {
    const [currentMonth, setCurrentMonth] = useState<Date>(selected || new Date())
    const [showYearPicker, setShowYearPicker] = useState(false)
    const [showMonthPicker, setShowMonthPicker] = useState(false)

    const currentYear = currentMonth.getFullYear()
    const currentMonthIndex = currentMonth.getMonth()

    const handleYearSelect = (year: number) => {
        const newDate = new Date(currentMonth)
        newDate.setFullYear(year)
        setCurrentMonth(newDate)
    }

    const handleMonthSelect = (month: number) => {
        const newDate = new Date(currentMonth)
        newDate.setMonth(month)
        setCurrentMonth(newDate)
    }

    const navigateMonth = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentMonth)
        if (direction === 'prev') {
            newDate.setMonth(newDate.getMonth() - 1)
        } else {
            newDate.setMonth(newDate.getMonth() + 1)
        }
        setCurrentMonth(newDate)
    }

    return (
        <div className="w-fit mx-auto">
            {/* 自定义标题栏 */}
            <div className="flex items-center justify-center px-3 py-2 border-b h-10">
                <div className="flex items-center gap-2 h-10">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-10 w-10 p-0 flex items-center justify-center"
                        onClick={() => navigateMonth('prev')}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <span className="text-lg leading-none" style={{ transform: 'translateY(-2px)' }}>‹</span>
                    </Button>

                    <div className="flex items-center h-10">
                        <Popover open={showYearPicker} onOpenChange={setShowYearPicker}>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm" className="font-medium h-10 px-1 flex items-center justify-center hover:bg-accent hover:text-accent-foreground">
                                    {currentYear}年
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <YearPicker
                                    selectedYear={currentYear}
                                    onYearSelect={handleYearSelect}
                                    isOpen={showYearPicker}
                                    onClose={() => setShowYearPicker(false)}
                                />
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
                        className="h-10 w-10 p-0 flex items-center justify-center"
                        onClick={() => navigateMonth('next')}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <span className="text-lg leading-none" style={{ transform: 'translateY(-2px)' }}>›</span>
                    </Button>
                </div>
            </div>

            {/* 日历主体 */}
            <Calendar
                mode="single"
                selected={selected}
                onSelect={onSelect}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                locale={zhCN}
                className="border-0"
                classNames={{
                    root: "w-fit",
                    months: "flex flex-col",
                    month: "flex flex-col w-full",
                    nav: "hidden", // 隐藏默认的导航按钮
                    month_caption: "hidden", // 隐藏默认的标题
                    dropdowns: "hidden", // 隐藏默认的下拉选择器
                }}
            />
        </div>
    )
}

export default function CalendarTestPage() {
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [date2, setDate2] = useState<Date | undefined>(new Date())
    const [dateRange, setDateRange] = useState<DateRange | undefined>()

    return (
        <div className="container mx-auto p-8 space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold mb-2">日历组件测试页面</h1>
                <p className="text-muted-foreground">测试新的年份和月份选择器实现</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 新的自定义日历 */}
                <Card>
                    <CardHeader>
                        <CardTitle>新的网格选择器日历</CardTitle>
                        <CardDescription>
                            点击年份或月份会弹出网格布局的选择器
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <CustomCalendar
                            selected={date}
                            onSelect={setDate}
                        />
                    </CardContent>
                </Card>

                {/* 原始日历对比 */}
                <Card>
                    <CardHeader>
                        <CardTitle>原始下拉菜单日历</CardTitle>
                        <CardDescription>
                            使用默认的下拉菜单选择年份和月份
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <Calendar
                            mode="single"
                            selected={date2}
                            onSelect={setDate2}
                            captionLayout="dropdown"
                            locale={zhCN}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* 日期选择器对比 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>新的日期选择器</CardTitle>
                        <CardDescription>
                            使用新的网格选择器的日期选择器
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start text-left font-normal"
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP", { locale: zhCN }) : "选择日期"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <CustomCalendar
                                    selected={date}
                                    onSelect={setDate}
                                />
                            </PopoverContent>
                        </Popover>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>原始日期选择器</CardTitle>
                        <CardDescription>
                            使用原始下拉菜单的日期选择器
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start text-left font-normal"
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date2 ? format(date2, "PPP", { locale: zhCN }) : "选择日期"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={date2}
                                    onSelect={setDate2}
                                    captionLayout="dropdown"
                                    locale={zhCN}
                                />
                            </PopoverContent>
                        </Popover>
                    </CardContent>
                </Card>
            </div>

            {/* 选中的日期显示 */}
            <Card>
                <CardHeader>
                    <CardTitle>选中的日期</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <p>
                            <strong>新日历选中日期：</strong>
                            {date ? format(date, "yyyy年MM月dd日 EEEE", { locale: zhCN }) : "未选择"}
                        </p>
                        <p>
                            <strong>原始日历选中日期：</strong>
                            {date2 ? format(date2, "yyyy年MM月dd日 EEEE", { locale: zhCN }) : "未选择"}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* 范围选择日历 */}
            <Card>
                <CardHeader>
                    <CardTitle>范围选择日历</CardTitle>
                    <CardDescription>支持选择日期范围的日历组件，可以测试新的颜色效果</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
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
                                        <span>选择日期范围</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateRange?.from}
                                    selected={dateRange}
                                    onSelect={setDateRange}
                                    numberOfMonths={2}
                                    locale={zhCN}
                                />
                            </PopoverContent>
                        </Popover>

                        <div className="text-sm text-muted-foreground">
                            <p><strong>选择的日期范围：</strong></p>
                            {dateRange?.from ? (
                                <div className="mt-2">
                                    <p>开始日期：{format(dateRange.from, 'yyyy年MM月dd日 EEEE', { locale: zhCN })}</p>
                                    {dateRange.to && (
                                        <p>结束日期：{format(dateRange.to, 'yyyy年MM月dd日 EEEE', { locale: zhCN })}</p>
                                    )}
                                    {dateRange.from && dateRange.to && (
                                        <p>天数：{Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1} 天</p>
                                    )}
                                </div>
                            ) : (
                                <p>未选择日期范围</p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
