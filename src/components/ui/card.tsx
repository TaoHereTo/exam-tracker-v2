import * as React from "react"

import { cn } from "@/lib/utils"
import { MixedText } from "./MixedText"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [canHover, setCanHover] = React.useState(true);

  // 检查内容是否包含交互控件
  const checkInteractive = React.useCallback(() => {
    if (!ref.current) return;
    const selectors = [
      "input",
      "select",
      "textarea",
      "button",
      '[role="combobox"]',
      '[data-slot="calendar"]',
      '[data-slot="select-trigger"]',
      '[data-slot="popover-content"]',
      '[data-slot="date-picker"]',
    ];
    for (const sel of selectors) {
      if (ref.current.querySelector(sel)) {
        setCanHover(false);
        return;
      }
    }
    setCanHover(true);
  }, []);

  React.useEffect(() => {
    checkInteractive();
  }, [props.children, checkInteractive]);

  return (
    <div
      ref={ref}
      data-slot="card"
      onMouseEnter={checkInteractive}
      className={cn(
        "card bg-card text-card-foreground flex flex-col gap-3 rounded-xl border py-6 shadow-sm transition-all duration-200",
        canHover && "hover:shadow-lg hover:-translate-y-1",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-4",
        className
      )}
      {...props}
    >
      {typeof children === 'string' ? <MixedText text={children} /> : children}
    </div>
  )
}

function CardTitle({ className, children, ...props }: React.ComponentProps<"div">) {
  // 如果 children 是字符串，使用 MixedText
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    >
      {typeof children === 'string' ? <MixedText text={children} /> : children}
    </div>
  )
}

function CardDescription({ className, children, ...props }: React.ComponentProps<"div">) {
  // 如果 children 是字符串，使用 MixedText
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    >
      {typeof children === 'string' ? <MixedText text={children} /> : children}
    </div>
  )
}

function CardAction({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    >
      {typeof children === 'string' ? <MixedText text={children} /> : children}
    </div>
  )
}

function CardContent({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6 pb-4", className)}
      {...props}
    >
      {typeof children === 'string' ? <MixedText text={children} /> : children}
    </div>
  )
}

function CardFooter({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    >
      {typeof children === 'string' ? <MixedText text={children} /> : children}
    </div>
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
