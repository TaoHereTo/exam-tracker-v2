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
}

export function BorderBeamCard({
  children,
  className,
  size = 200,
  duration = 15,
  delay = 0,
  borderWidth = 1.5,
  colorFrom = "#9333ea",
  colorTo = "#0ea5e9",
  ...props
}: BorderBeamCardProps) {
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