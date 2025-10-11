"use client";

import { cn } from "@/lib/utils";
import { BorderBeam } from "@/components/magicui/border-beam";
import React from "react";

interface BorderBeamCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  size?: number;
  duration?: number;
  delay?: number;
  borderWidth?: number;
  colorFrom?: string;
  colorTo?: string;
  borderColor?: string; // 单一边框颜色（会同时用于from和to）
}

export function BorderBeamCard({
  children,
  className,
  size = 200,
  duration = 15,
  delay = 0,
  borderWidth = 1.5,
  colorFrom: colorFromProp,
  colorTo: colorToProp,
  borderColor,
  ...props
}: BorderBeamCardProps) {
  // 如果提供了borderColor，则同时用于from和to
  const colorFrom = borderColor || colorFromProp || "#9333ea";
  const colorTo = borderColor || colorToProp || "#0ea5e9";
  return (
    <div
      className={cn(
        "relative rounded-xl border border-border bg-card text-card-foreground shadow-md overflow-hidden transition-none hover:shadow-md",
        className
      )}
      {...props}
    >
      {children}
      <BorderBeam
        size={size}
        duration={duration}
        delay={delay}
        borderWidth={borderWidth}
        colorFrom={colorFrom}
        colorTo={colorTo}
      />
    </div>
  );
}