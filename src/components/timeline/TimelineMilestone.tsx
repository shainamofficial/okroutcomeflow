import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Diamond } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TimelineMilestoneProps {
  date: Date;
  getPositionForDate: (date: Date) => number;
  getDateForPosition: (position: number) => Date;
  canDrag: boolean;
  onDragEnd: (newDate: Date) => void;
  variant: "initiative" | "task";
  label: string;
}

export function TimelineMilestone({
  date,
  getPositionForDate,
  getDateForPosition,
  canDrag,
  onDragEnd,
  variant,
  label,
}: TimelineMilestoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(date);
  const markerRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number>(0);
  const initialDate = useRef<Date>(date);

  const left = getPositionForDate(isDragging ? tempDate : date);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canDrag) return;
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
    dragStartX.current = e.clientX;
    initialDate.current = date;
    setTempDate(date);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newDate = getDateForPosition(
        getPositionForDate(initialDate.current) + (e.clientX - dragStartX.current)
      );
      setTempDate(newDate);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (tempDate.getTime() !== date.getTime()) {
        onDragEnd(tempDate);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, tempDate, date, getPositionForDate, getDateForPosition, onDragEnd]);

  const color = variant === "initiative" ? "text-primary" : "text-secondary";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          ref={markerRef}
          className={cn(
            "absolute flex items-center justify-center",
            canDrag && "cursor-grab",
            isDragging && "cursor-grabbing"
          )}
          style={{
            left,
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
          onMouseDown={handleMouseDown}
        >
          <Diamond
            className={cn("h-5 w-5 fill-current", color, isDragging && "opacity-80")}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">
          Due: {format(isDragging ? tempDate : date, "MMM d, yyyy")}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
