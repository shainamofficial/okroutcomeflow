import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useKRMetricValues } from "@/hooks/useKRMetrics";

interface AddMetricValueFormProps {
  configId: string;
  unit: string;
}

export function AddMetricValueForm({ configId, unit }: AddMetricValueFormProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [value, setValue] = useState("");
  const { addValue } = useKRMetricValues(configId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || value === "") return;

    await addValue.mutateAsync({
      date: format(date, "yyyy-MM-dd"),
      value: parseFloat(value),
    });
    setValue("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="space-y-1">
        <Label className="text-xs">Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "w-[140px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-3 w-3" />
              {date ? format(date, "MMM d, yyyy") : "Date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="space-y-1 flex-1">
        <Label className="text-xs">Value ({unit})</Label>
        <Input
          type="number"
          step="any"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="0"
          className="h-9"
        />
      </div>
      <Button type="submit" size="sm" disabled={addValue.isPending || !date || value === ""}>
        <Plus className="h-4 w-4" />
      </Button>
    </form>
  );
}
