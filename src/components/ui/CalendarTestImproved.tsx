"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"

export function CalendarTestImproved() {
  const [date, setDate] = React.useState<Date | undefined>(new Date())

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Improved Calendar Test</h2>
      <Calendar
        mode="single"
        captionLayout="dropdown"
        selected={date}
        onSelect={setDate}
        className="rounded-md border"
      />
      <div className="mt-4">
        <p>Selected date: {date?.toLocaleDateString() || 'None'}</p>
      </div>
    </div>
  )
}