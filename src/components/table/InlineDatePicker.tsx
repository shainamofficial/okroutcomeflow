import { useState } from "react";
import { format, isPast, isToday } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface InlineDatePickerProps {
  date: string | null;
  onDateChange: (date: string | null) => void;
  isOverdue?: boolean;
}

export function InlineDatePicker({ date, onDateChange, isOverdue }: InlineDatePickerProps) {
  const [open, setOpen] = useState(false);
  const dateValue = date ? new Date(date) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 px-1 text-xs font-normal justify-start hover:bg-accent/50",
            isOverdue && "text-destructive font-medium",
            !date && "text-muted-foreground"
          )}
        >
          {date ? format(new Date(date), "MMM d, yyyy") : "—"}
          {isOverdue && " ⚠️"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={(d) => {
            onDateChange(d ? format(d, "yyyy-MM-dd") : null);
            setOpen(false);
          }}
          initialFocus
        />
        {date && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground"
              onClick={() => { onDateChange(null); setOpen(false); }}
            >
              Clear date
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
