"use client"

import * as React from "react"
import { DateRange } from "react-day-picker"
import { DateRangePicker } from "@/components/ui/DateRangePicker"

export function CalendarTest() {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: new Date(2025, 7, 1),
    to: new Date(2025, 7, 15)
  })

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Calendar Test</h2>
      <DateRangePicker 
        dateRange={dateRange} 
        onDateRangeChange={setDateRange} 
      />
      <div className="mt-4">
        <p>Selected range:</p>
        <p>From: {dateRange?.from?.toLocaleDateString() || 'None'}</p>
        <p>To: {dateRange?.to?.toLocaleDateString() || 'None'}</p>
      </div>
    </div>
  )
}