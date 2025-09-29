"use client"

import * as React from "react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type DatePickerProps = {
    className?: string;
    placeholder?: string;
    date?: Date;
    setDate?: (date?: Date) => void;
}

export function DatePicker({ className, placeholder = "Pilih tanggal", date: propDate, setDate: propSetDate }: DatePickerProps) {
  const [internalDate, setInternalDate] = React.useState<Date>()
  const date = propDate ?? internalDate;
  const setDate = propSetDate ?? setInternalDate;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP", { locale: id }) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
