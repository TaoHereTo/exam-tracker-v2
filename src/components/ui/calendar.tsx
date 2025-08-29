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

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-background group/calendar p-3 [--cell-size:2rem] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "relative flex flex-col gap-4 md:flex-row",
          defaultClassNames.months
        ),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-[--cell-size] w-[--cell-size] select-none p-0 aria-disabled:opacity-50",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-[--cell-size] w-[--cell-size] select-none p-0 aria-disabled:opacity-50",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex h-[--cell-size] w-full items-center justify-center px-[--cell-size]",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "flex h-[--cell-size] w-full items-center justify-center gap-1 text-sm font-medium",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "has-focus:border-ring border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] relative rounded-md border",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn("absolute inset-0 opacity-0", defaultClassNames.dropdown),
        caption_label: cn(
          "select-none font-medium",
          captionLayout === "label"
            ? "text-sm"
            : "[&>svg]:text-muted-foreground flex h-8 items-center gap-1 rounded-md pl-2 pr-1 text-sm [&>svg]:size-3.5",
          defaultClassNames.caption_label
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "text-muted-foreground flex-1 select-none rounded-md text-[0.8rem] font-normal",
          defaultClassNames.weekday
        ),
        week: cn("mt-2 flex w-full", defaultClassNames.week),
        week_number_header: cn(
          "w-[--cell-size] select-none",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-muted-foreground select-none text-[0.8rem]",
          defaultClassNames.week_number
        ),
        day: cn(
          "group/day relative aspect-square h-full w-full select-none p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md",
          defaultClassNames.day
        ),
        range_start: cn(
          "bg-accent rounded-l-md",
          defaultClassNames.range_start
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn("bg-accent rounded-r-md", defaultClassNames.range_end),
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
          // Handle pointer events to prevent calendar from closing when interacting with dropdowns
          const handlePointerDown = (e: React.PointerEvent) => {
            e.stopPropagation();
          };
          
          const handleMouseDown = (e: React.MouseEvent) => {
            e.stopPropagation();
          };
          
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              onPointerDown={handlePointerDown}
              onMouseDown={handleMouseDown}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-5", className)} {...props} />
            )
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-5", className)}
                {...props}
              />
            )
          }

          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          )
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-[--cell-size] items-center justify-center text-center">
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames()
  const [isDark, setIsDark] = React.useState(false)

  const ref = React.useRef<HTMLButtonElement>(null)

  // 避免库的默认 focused 导致跳焦到今天；仅在选中时保持焦点在所选日期
  React.useEffect(() => {
    if (modifiers.selected) ref.current?.focus()
  }, [modifiers.selected])

  // 检测主题变化
  React.useEffect(() => {
    const checkTheme = () => {
      if (typeof window !== 'undefined') {
        setIsDark(document.documentElement.classList.contains('dark'))
      }
    }

    checkTheme()

    // 监听主题变化
    const observer = new MutationObserver(checkTheme)
    if (typeof window !== 'undefined') {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
      })
    }

    return () => observer.disconnect()
  }, [])

  // 根据状态确定样式
  const getButtonStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      minWidth: 'var(--cell-size)',
      aspectRatio: '1',
      border: 'none',
      borderRadius: '8px', // 增加圆角
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 'normal',
      outline: 'none',
      transition: 'all 0.2s ease'
    }

    if (modifiers.selected || modifiers.range_start || modifiers.range_end) {
      return {
        ...baseStyle,
        backgroundColor: isDark ? '#ffffff' : '#000000',
        color: isDark ? '#000000' : '#ffffff',
        borderRadius: '8px'
      }
    }

    if (modifiers.range_middle) {
      return {
        ...baseStyle,
        backgroundColor: isDark ? '#333333' : '#f0f0f0',
        color: isDark ? '#ffffff' : '#000000',
        borderRadius: '0px' // 范围中间保持方形连接
      }
    }

    // 默认状态
    return {
      ...baseStyle,
      backgroundColor: 'transparent',
      color: isDark ? '#ffffff' : '#000000'
    }
  }

  // 处理点击事件，防止事件冒泡导致日历关闭
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // 阻止事件冒泡到父级元素，避免触发 Popover 的关闭逻辑
    e.stopPropagation()
    // 调用原始的 onClick 处理函数（如果存在）
    if (props.onClick) {
      props.onClick(e)
    }
  }

  return (
    <button
      ref={ref}
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
      style={getButtonStyle()}
      className={cn(
        "calendar-day-button",
        // 添加hover和focus效果
        "hover:bg-accent hover:text-accent-foreground hover:shadow-sm",
        // 移除选中日期的focus环，只保留黑色填充
        modifiers.selected || modifiers.range_start || modifiers.range_end ?
          "focus:ring-0 focus:ring-offset-0 hover:opacity-90 shadow-sm" :
          "focus:ring-2 focus:ring-ring focus:ring-opacity-50 focus:shadow-md",
        defaultClassNames.day,
        className
      )}
      onClick={handleClick}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }