"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export function CalendarTestFinal() {
  const [date, setDate] = React.useState<Date | undefined>(new Date())

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Final Calendar Test</h2>
      <Calendar
        mode="single"
        captionLayout="dropdown"
        selected={date}
        onSelect={setDate}
        className="rounded-md border"
        locale={zhCN}
      />
      <div className="mt-4">
        <p>Selected date: {date ? format(date, 'PPP', { locale: zhCN }) : 'None'}</p>
      </div>
    </div>
  )
}