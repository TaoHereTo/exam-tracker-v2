import * as React from "react"

import { cn } from "@/lib/utils"
import { MixedText } from "./MixedText"

const Card = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  function Card({ className, ...props }: React.ComponentProps<"div">, ref) {
    const innerRef = React.useRef<HTMLDivElement>(null);
    const [canHover, setCanHover] = React.useState(true);

    // 检查内容是否包含交互控件
    const checkInteractive = React.useCallback(() => {
      if (!innerRef.current) return;
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
        if (innerRef.current.querySelector(sel)) {
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
        ref={ref || innerRef}
        data-slot="card"
        onMouseEnter={checkInteractive}
        className={cn(
          "card text-card-foreground flex flex-col card-content rounded-xl border border-border p-card shadow-md",
          className
        )}
        {...props}
      />
    )
  }
)

Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  function CardHeader({ className, children, ...props }: React.ComponentProps<"div">, ref) {
    return (
      <div
        ref={ref}
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
)

CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  function CardTitle({ className, children, ...props }: React.ComponentProps<"div">, ref) {
    // 如果 children 是字符串，使用 MixedText
    return (
      <div
        ref={ref}
        data-slot="card-title"
        className={cn("leading-none font-semibold unselectable", className)}
        {...props}
      >
        {typeof children === 'string' ? <MixedText text={children} /> : children}
      </div>
    )
  }
)

CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  function CardDescription({ className, children, ...props }: React.ComponentProps<"div">, ref) {
    // 如果 children 是字符串，使用 MixedText
    return (
      <div
        ref={ref}
        data-slot="card-description"
        className={cn("text-muted-foreground text-sm", className)}
        {...props}
      >
        {typeof children === 'string' ? <MixedText text={children} /> : children}
      </div>
    )
  }
)

CardDescription.displayName = "CardDescription"

const CardAction = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  function CardAction({ className, children, ...props }: React.ComponentProps<"div">, ref) {
    return (
      <div
        ref={ref}
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
)

CardAction.displayName = "CardAction"

const CardContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  function CardContent({ className, children, ...props }: React.ComponentProps<"div">, ref) {
    return (
      <div
        ref={ref}
        data-slot="card-content"
        className={cn("px-6 pb-4", className)}
        {...props}
      >
        {typeof children === 'string' ? <MixedText text={children} /> : children}
      </div>
    )
  }
)

CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  function CardFooter({ className, children, ...props }: React.ComponentProps<"div">, ref) {
    return (
      <div
        ref={ref}
        data-slot="card-footer"
        className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
        {...props}
      >
        {typeof children === 'string' ? <MixedText text={children} /> : children}
      </div>
    )
  }
)

CardFooter.displayName = "CardFooter"

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}