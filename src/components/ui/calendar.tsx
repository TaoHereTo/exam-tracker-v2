"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { MixedText } from "./MixedText"

// 年份选择器组件
function YearPicker({
  selectedYear,
  onYearSelect,
  isOpen,
  onClose,
  themeColor = "#0d9488"
}: {
  selectedYear: number
  onYearSelect: (year: number) => void
  isOpen: boolean
  onClose: () => void
  themeColor?: string
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
    <div className="w-fit p-4">
      <div className="flex justify-center items-center mb-3 h-8 gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 !border-0 !shadow-none rounded-md flex items-center justify-center"
          onClick={() => {
            const newIndex = Math.max(0, currentGroupIndex - 1)
            const newYear = startYear + newIndex * 16
            onYearSelect(newYear)
          }}
          disabled={currentGroupIndex === 0}
        >
          <span className="text-sm leading-none">‹</span>
        </Button>

        <span className="text-sm font-medium px-2 flex items-center">
          {startYear + currentGroupIndex * 16} - {Math.min(startYear + currentGroupIndex * 16 + 15, endYear)}
        </span>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 !border-0 !shadow-none rounded-md flex items-center justify-center"
          onClick={() => {
            const newIndex = Math.min(yearGroups.length - 1, currentGroupIndex + 1)
            const newYear = startYear + newIndex * 16
            onYearSelect(newYear)
          }}
          disabled={currentGroupIndex === yearGroups.length - 1}
        >
          <span className="text-sm leading-none">›</span>
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-1">
        {yearGroups[currentGroupIndex]?.map((year) => (
          <Button
            key={year}
            variant="ghost"
            size="sm"
            data-selected-single={selectedYear === year}
            className={cn(
              "data-[selected-single=true]:text-white data-[selected-single=true]:rounded-md group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground hover:rounded-md flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-[var(--z-focused)] group-data-[focused=true]/day:ring-[3px] h-8 px-2 py-1 !border-0 !shadow-none"
            )}
            data-theme-color={themeColor}
            style={{
              ...(selectedYear === year && {
                backgroundColor: themeColor,
                color: 'white'
              })
            }}
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
  onClose,
  themeColor = "#0d9488"
}: {
  selectedMonth: number
  onMonthSelect: (month: number) => void
  isOpen: boolean
  onClose: () => void
  themeColor?: string
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
    <div className="w-fit p-4">
      <div className="grid grid-cols-3 gap-1">
        {months.map((month) => (
          <Button
            key={month.value}
            variant="ghost"
            size="sm"
            data-selected-single={selectedMonth === month.value}
            className={cn(
              "data-[selected-single=true]:text-white data-[selected-single=true]:rounded-md group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground hover:rounded-md flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-[var(--z-focused)] group-data-[focused=true]/day:ring-[3px] h-8 px-2 py-1 !border-0 !shadow-none"
            )}
            data-theme-color={themeColor}
            style={{
              ...(selectedMonth === month.value && {
                backgroundColor: themeColor,
                color: 'white'
              })
            }}
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

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  themeColor = "#0d9488",
  page = "default",
  showCustomHeader = true,
  numberOfMonths,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
  themeColor?: string
  page?: string
  showCustomHeader?: boolean
  numberOfMonths?: number
}) {
  const defaultClassNames = getDefaultClassNames()

  // 根据页面自动选择颜色
  const getPageColor = (page: string) => {
    const pageColors: Record<string, string> = {
      'new-record': '#347659',
      'add-record': '#0d9488',
      'study-plan': '#324CC8',
      'countdown': '#db2777',
      'schedule': '#845EEE',
      'knowledge': '#253985',
      'history': '#253985',
      'default': '#0d9488'
    };
    return pageColors[page] || themeColor;
  };

  const finalThemeColor = getPageColor(page);

  // 状态管理
  const [currentYear, setCurrentYear] = React.useState(() => {
    return props.month ? props.month.getFullYear() : new Date().getFullYear()
  })
  const [currentMonthIndex, setCurrentMonthIndex] = React.useState(() => {
    return props.month ? props.month.getMonth() : new Date().getMonth()
  })
  const [showYearPicker, setShowYearPicker] = React.useState(false)
  const [showMonthPicker, setShowMonthPicker] = React.useState(false)

  // 当外部传入的 month 属性变化时，同步更新内部状态
  React.useEffect(() => {
    if (props.month) {
      setCurrentYear(props.month.getFullYear())
      setCurrentMonthIndex(props.month.getMonth())
    }
  }, [props.month])

  const handleYearSelect = (year: number) => {
    setCurrentYear(year)
    // 创建新的日期对象并调用外部回调
    const newDate = new Date(year, currentMonthIndex, 1)
    if (props.onMonthChange) {
      props.onMonthChange(newDate)
    }
    // 不自动关闭年份选择器，让用户可以继续选择
  }

  const handleMonthSelect = (monthIndex: number) => {
    setCurrentMonthIndex(monthIndex)
    setShowMonthPicker(false)
    // 创建新的日期对象并调用外部回调
    const newDate = new Date(currentYear, monthIndex, 1)
    if (props.onMonthChange) {
      props.onMonthChange(newDate)
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    let newYear = currentYear
    let newMonthIndex = currentMonthIndex

    if (direction === 'prev') {
      if (currentMonthIndex === 0) {
        newMonthIndex = 11
        newYear = currentYear - 1
      } else {
        newMonthIndex = currentMonthIndex - 1
      }
    } else {
      if (currentMonthIndex === 11) {
        newMonthIndex = 0
        newYear = currentYear + 1
      } else {
        newMonthIndex = currentMonthIndex + 1
      }
    }

    setCurrentMonthIndex(newMonthIndex)
    setCurrentYear(newYear)

    // 创建新的日期对象并调用外部回调
    const newDate = new Date(newYear, newMonthIndex, 1)
    if (props.onMonthChange) {
      props.onMonthChange(newDate)
    }
  }

  const currentDate = new Date(currentYear, currentMonthIndex, 1)

  // 智能月份数量配置 - 根据模式决定
  const responsiveNumberOfMonths = numberOfMonths ||
    (props.mode === 'range'
      ? (typeof window !== 'undefined' && window.innerWidth < 768 ? 1 : 2)
      : 1) // 单日期模式始终显示1个月

  return (
    <div
      className="calendar-container"
      style={{
        '--calendar-theme-color': finalThemeColor,
        '--calendar-theme-color-light': `${finalThemeColor}4D`
      } as React.CSSProperties}
    >
      {/* 自定义标题栏 - 只在 showCustomHeader 为 true 时显示 */}
      {showCustomHeader && (
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
            <Popover open={showYearPicker} onOpenChange={(open) => {
              setShowYearPicker(open);
            }}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-medium h-10 px-1 flex items-center justify-center"
                  onClick={() => {
                    setShowYearPicker(true);
                  }}
                >
                  {currentYear}年
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[var(--z-dialog-popover)]" align="start">
                <YearPicker
                  selectedYear={currentYear}
                  onYearSelect={handleYearSelect}
                  isOpen={showYearPicker}
                  onClose={() => setShowYearPicker(false)}
                  themeColor={finalThemeColor}
                />
              </PopoverContent>
            </Popover>

            <Popover open={showMonthPicker} onOpenChange={(open) => {
              setShowMonthPicker(open);
            }}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-medium h-10 px-1 flex items-center justify-center"
                  onClick={() => {
                    setShowMonthPicker(true);
                  }}
                >
                  {currentMonthIndex + 1}月
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[var(--z-dialog-popover)]" align="start">
                <MonthPicker
                  selectedMonth={currentMonthIndex}
                  onMonthSelect={handleMonthSelect}
                  isOpen={showMonthPicker}
                  onClose={() => setShowMonthPicker(false)}
                  themeColor={finalThemeColor}
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
      )}

      <DayPicker
        showOutsideDays={showOutsideDays}
        month={props.month || currentDate}
        onMonthChange={(date) => {
          // 更新内部状态
          setCurrentYear(date.getFullYear())
          setCurrentMonthIndex(date.getMonth())
          // 调用外部传入的 onMonthChange 回调
          if (props.onMonthChange) {
            props.onMonthChange(date)
          }
        }}
        className={cn(
          "group/calendar p-3 [--cell-size:--spacing(8)] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
          String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
          String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
          className
        )}
        captionLayout="label"
        numberOfMonths={responsiveNumberOfMonths}
        formatters={{
          formatMonthDropdown: (date) =>
            date.toLocaleString("default", { month: "short" }),
          ...formatters,
        }}
        classNames={{
          root: cn("w-fit", defaultClassNames.root),
          months: cn(
            "flex gap-4 flex-col md:flex-row relative",
            defaultClassNames.months
          ),
          month: cn("flex flex-col w-full gap-4", defaultClassNames.month),
          nav: cn(
            "hidden", // 隐藏默认导航
            defaultClassNames.nav
          ),
          button_previous: cn(
            buttonVariants({ variant: buttonVariant }),
            "size-(--cell-size) aria-disabled:opacity-50 p-0 select-none",
            defaultClassNames.button_previous
          ),
          button_next: cn(
            buttonVariants({ variant: buttonVariant }),
            "size-(--cell-size) aria-disabled:opacity-50 p-0 select-none",
            defaultClassNames.button_next
          ),
          month_caption: cn(
            "hidden", // 隐藏默认标题栏
            defaultClassNames.month_caption
          ),
          dropdowns: cn(
            "hidden", // 隐藏默认下拉选择器
            defaultClassNames.dropdowns
          ),
          dropdown_root: cn(
            "relative has-focus:border-ring border border-[color:var(--input-border)] shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] rounded-md",
            "bg-white dark:bg-[#303030]",
            defaultClassNames.dropdown_root
          ),
          dropdown: cn(
            "absolute bg-popover inset-0 opacity-0",
            defaultClassNames.dropdown
          ),
          caption_label: cn(
            "select-none font-medium",
            captionLayout === "label"
              ? "text-sm"
              : "rounded-md pl-2 pr-1 flex items-center gap-1 text-sm h-8 [&>svg]:text-muted-foreground [&>svg]:size-3.5",
            defaultClassNames.caption_label
          ),
          table: "w-full border-collapse",
          weekdays: cn("flex", defaultClassNames.weekdays),
          weekday: cn(
            "text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] select-none",
            defaultClassNames.weekday
          ),
          week: cn("flex w-full mt-2", defaultClassNames.week),
          week_number_header: cn(
            "select-none w-(--cell-size)",
            defaultClassNames.week_number_header
          ),
          week_number: cn(
            "text-[0.8rem] select-none text-muted-foreground",
            defaultClassNames.week_number
          ),
          day: cn(
            "relative w-full h-full p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none",
            defaultClassNames.day
          ),
          range_start: cn(
            "rounded-l-md bg-accent",
            defaultClassNames.range_start
          ),
          range_middle: cn("rounded-none", defaultClassNames.range_middle),
          range_end: cn("rounded-r-md bg-accent", defaultClassNames.range_end),
          today: cn(
            "data-[selected=true]:rounded-none",
            defaultClassNames.today
          ),
          outside: cn(
            "text-muted-foreground aria-selected:text-muted-foreground",
            defaultClassNames.outside
          ),
          disabled: cn(
            "text-muted-foreground opacity-50",
            defaultClassNames.disabled
          ),
          hidden: cn("invisible", defaultClassNames.hidden),
          ...classNames,
        }}
        components={{
          Root: ({ className, rootRef, ...props }) => {
            return (
              <div
                data-slot="calendar"
                ref={rootRef}
                className={cn(className)}
                {...props}
              />
            )
          },
          Chevron: ({ className, orientation, ...props }) => {
            if (orientation === "left") {
              return (
                <ChevronLeftIcon className={cn("size-4", className)} {...props} />
              )
            }

            if (orientation === "right") {
              return (
                <ChevronRightIcon
                  className={cn("size-4", className)}
                  {...props}
                />
              )
            }

            return (
              <ChevronDownIcon className={cn("size-4", className)} {...props} />
            )
          },
          DayButton: (props) => <CalendarDayButton {...props} themeColor={finalThemeColor} />,
          WeekNumber: ({ children, ...props }) => {
            return (
              <td {...props}>
                <div className="flex size-(--cell-size) items-center justify-center text-center">
                  {children}
                </div>
              </td>
            )
          },
          ...components,
        }}
        {...props}
      />
    </div>
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  themeColor = "#0d9488",
  ...props
}: React.ComponentProps<typeof DayButton> & { themeColor?: string }) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  // 使用useLayoutEffect代替useEffect，避免无限循环
  // 只有当focused状态实际发生变化时才聚焦
  const prevFocusedRef = React.useRef(modifiers.focused);

  React.useLayoutEffect(() => {
    if (modifiers.focused && !prevFocusedRef.current) {
      ref.current?.focus();
    }
    prevFocusedRef.current = modifiers.focused;
  }, [modifiers.focused]);

  // 强制设置中间日期的文字颜色
  React.useLayoutEffect(() => {
    if (modifiers.range_middle && ref.current) {
      // 简单直接地设置颜色
      ref.current.style.color = themeColor;
    }
  }, [modifiers.range_middle, themeColor]);

  // 设置今天的样式
  React.useLayoutEffect(() => {
    if (modifiers.today && ref.current) {
      ref.current.style.backgroundColor = '#f1f5f9';
      ref.current.style.color = '#0f172a';
    }
  }, [modifiers.today]);






  return (
    <Button
      ref={ref}
      variant="ghost"
      size="sm"
      type="button"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "data-[selected-single=true]:text-white data-[selected-single=true]:rounded-md data-[range-start=true]:text-white data-[range-end=true]:text-white group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground hover:rounded-md flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-[var(--z-focused)] group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&>span]:text-xs [&>span]:opacity-70 h-8 px-2 py-1",
        // 为中间日期添加特殊的类名
        modifiers.range_middle && `range-middle-${themeColor.replace('#', '')}`,
        defaultClassNames.day,
        className
      )}
      data-theme-color={themeColor}
      style={{
        ...(modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle && {
          backgroundColor: themeColor,
          color: 'white'
        }),
        ...(modifiers.range_middle && {
          backgroundColor: `${themeColor}4D`, // 使用十六进制透明度，相当于0.3的透明度
          color: themeColor
        }),
        ...(modifiers.range_start && {
          backgroundColor: themeColor,
          color: 'white'
        }),
        ...(modifiers.range_end && {
          backgroundColor: themeColor,
          color: 'white'
        }),
        ...(modifiers.today && {
          backgroundColor: '#f1f5f9',
          color: '#0f172a'
        })
      } as React.CSSProperties}
      {...props}
    />
  )
}

// 增强的日期范围选择器组件
function DateRangePicker({
  dateRange,
  onDateRangeChange,
  placeholder = "选择日期范围",
  className,
  disabled = false,
  error = false,
  themeColor = "#0d9488",
  page = "default"
}: {
  dateRange?: DateRange
  onDateRangeChange?: (range: DateRange | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  error?: boolean
  themeColor?: string
  page?: string
}) {
  const [open, setOpen] = React.useState(false)

  // 智能月份对齐 - 根据选择的日期自动调整月份显示
  const [currentMonth, setCurrentMonth] = React.useState<Date | undefined>(() => {
    if (dateRange?.from) return dateRange.from
    if (dateRange?.to) return dateRange.to
    return new Date()
  })

  const fromTimestamp = dateRange?.from?.getTime();
  const toTimestamp = dateRange?.to?.getTime();

  React.useEffect(() => {
    // 当外部日期变化时，对齐月份到起始日期
    if (dateRange?.from) setCurrentMonth(dateRange.from)
    else if (dateRange?.to) setCurrentMonth(dateRange.to)
  }, [dateRange?.from, dateRange?.to, fromTimestamp, toTimestamp])

  const handleSelect = React.useCallback(
    (range: DateRange | undefined) => {
      // 更新月份到起始日期以保持正确的视图
      if (range?.from) setCurrentMonth(range.from)
      else if (range?.to) setCurrentMonth(range.to)
      onDateRangeChange?.(range)
    },
    [onDateRangeChange]
  )

  const handleOpenChange = React.useCallback((nextOpen: boolean) => {
    if (nextOpen) {
      // 打开时，对齐月份到起始日期
      if (dateRange?.from) setCurrentMonth(dateRange.from)
      else if (dateRange?.to) setCurrentMonth(dateRange.to)
    }
    setOpen(nextOpen)
  }, [dateRange?.from, dateRange?.to])

  // 防止弹窗在交互日历元素时关闭
  const handleCalendarInteraction = (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation()
  }

  // 处理月份/年份下拉变化而不关闭弹窗
  const handleMonthChange = React.useCallback((month: Date) => {
    setCurrentMonth(month)
  }, [])

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "w-full flex items-center justify-start text-left font-normal border px-3 py-2 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer rounded-md h-10 bg-white dark:bg-[#303030]",
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
            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
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
              <span className="text-gray-400 dark:text-gray-500">{placeholder}</span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 text-black dark:text-white z-[var(--z-dialog-popover)]"
          align="start"
          onPointerDownOutside={(e) => {
            // 防止在与下拉菜单交互时关闭
            const target = e.target as HTMLElement
            if (target.closest('.rdp-dropdown_root') || target.closest('.rdp-dropdown')) {
              e.preventDefault()
            }
          }}
          onInteractOutside={(e) => {
            // 防止在与下拉菜单交互时关闭
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
              month={currentMonth}
              onMonthChange={handleMonthChange}
              selected={dateRange}
              onSelect={handleSelect}
              locale={zhCN}
              themeColor={themeColor}
              page={page}
              captionLayout="label"
              showCustomHeader={true}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

// 为了向后兼容，导出 CustomDateRangePicker 作为 DateRangePicker 的别名
const CustomDateRangePicker = DateRangePicker

export { Calendar, CalendarDayButton, DateRangePicker, CustomDateRangePicker }