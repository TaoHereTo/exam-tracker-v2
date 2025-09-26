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
  themeColor = "#0d9488",
  page = "default",
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
  themeColor?: string
  page?: string
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


  return (
    <div
      className="calendar-container"
      style={{
        '--calendar-theme-color': finalThemeColor,
        '--calendar-theme-color-light': `${finalThemeColor}4D`
      } as React.CSSProperties}
    >
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn(
          "group/calendar p-3 [--cell-size:--spacing(8)] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
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
            "flex gap-4 flex-col md:flex-row relative",
            defaultClassNames.months
          ),
          month: cn("flex flex-col w-full gap-4", defaultClassNames.month),
          nav: cn(
            "flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between",
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
            "flex items-center justify-center h-(--cell-size) w-full px-(--cell-size)",
            defaultClassNames.month_caption
          ),
          dropdowns: cn(
            "w-full flex items-center text-sm font-medium justify-center h-(--cell-size) gap-1.5",
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