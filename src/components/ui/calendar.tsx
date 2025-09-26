"use client"

import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

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
            // 不关闭选择器
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
            // 不关闭选择器
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
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
  themeColor?: string
  page?: string
  showCustomHeader?: boolean
}) {
  const defaultClassNames = getDefaultClassNames()

  // 根据页面自动选择颜色
  const getPageColor = (page: string) => {
    const pageColors: Record<string, string> = {
      'new-record': '#347659',
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
        <div className="flex items-center justify-between px-3 py-2 h-10">
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 p-0 flex items-center justify-center"
            onClick={() => navigateMonth('prev')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <span className="text-lg leading-none" style={{ transform: 'translateY(-2px)' }}>‹</span>
          </Button>

          <div className="flex items-center gap-0 h-10">
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
            "bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none",
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






  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
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
        "data-[selected-single=true]:text-white data-[selected-single=true]:rounded-lg data-[range-start=true]:text-white data-[range-end=true]:text-white group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground hover:rounded-lg flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-lg data-[range-end=true]:rounded-r-lg data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-lg data-[range-start=true]:rounded-l-lg [&>span]:text-xs [&>span]:opacity-70",
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
        })
      } as React.CSSProperties}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }