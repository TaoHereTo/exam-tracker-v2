"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

export function CalendarComparisonTest() {
  const [date1, setDate1] = React.useState<Date | undefined>(new Date())
  const [open1, setOpen1] = React.useState(false)
  
  const [date2, setDate2] = React.useState<Date | undefined>(new Date())
  const [open2, setOpen2] = React.useState(false)

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-lg font-bold">Calendar Comparison Test</h2>
      
      <div>
        <h3 className="font-medium mb-2">Fixed Implementation (like Knowledge Form)</h3>
        <Popover open={open1} onOpenChange={setOpen1}>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date1 ? format(date1, "PPP", { locale: zhCN }) : <span>选择日期</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              captionLayout="dropdown"
              selected={date1}
              onSelect={(d) => {
                setDate1(d)
                setOpen1(false)
              }}
              initialFocus={false}
              locale={zhCN}
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div>
        <h3 className="font-medium mb-2">Original Implementation (problematic)</h3>
        <Popover open={open2} onOpenChange={(nextOpen) => {
          setOpen2(nextOpen)
        }}>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              captionLayout="dropdown"
              selected={date2}
              onSelect={setDate2}
              initialFocus={false}
              locale={zhCN}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}