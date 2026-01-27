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
  onClick?: () => void;
  variant: "initiative" | "task";
  label: string;
  ownerName?: string;
}

export function TimelineMilestone({
  date,
  getPositionForDate,
  getDateForPosition,
  canDrag,
  onDragEnd,
  onClick,
  variant,
  label,
  ownerName,
}: TimelineMilestoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(date);
  const markerRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number>(0);
  const dragStartY = useRef<number>(0);
  const initialDate = useRef<Date>(date);
  const hasMoved = useRef<boolean>(false);
  const CLICK_THRESHOLD = 5;

  const left = getPositionForDate(isDragging ? tempDate : date);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartY.current = e.clientY;
    initialDate.current = date;
    setTempDate(date);
    hasMoved.current = false;
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartX.current;
      const deltaY = e.clientY - dragStartY.current;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      if (distance > CLICK_THRESHOLD) {
        hasMoved.current = true;
      }

      if (!canDrag || !hasMoved.current) return;

      const newDate = getDateForPosition(
        getPositionForDate(initialDate.current) + deltaX
      );
      setTempDate(newDate);
    };

    const handleMouseUp = () => {
      setIsDragging(false);

      // If no significant movement, treat as click
      if (!hasMoved.current && onClick) {
        onClick();
        return;
      }

      // Only trigger update if date changed and dragging is allowed
      if (canDrag && hasMoved.current && tempDate.getTime() !== date.getTime()) {
        onDragEnd(tempDate);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, tempDate, date, getPositionForDate, getDateForPosition, onDragEnd, onClick, canDrag]);

  const color = variant === "initiative" ? "text-primary" : "text-secondary";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          ref={markerRef}
          className={cn(
            "absolute flex items-center justify-center cursor-pointer",
            canDrag && hasMoved.current && isDragging && "cursor-grabbing"
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
        {ownerName && (
          <p className="text-xs text-muted-foreground border-t border-border mt-1 pt-1">
            {variant === "initiative" ? "Owner" : "Assignee"}: {ownerName}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
