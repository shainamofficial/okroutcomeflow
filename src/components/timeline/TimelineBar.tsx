import { useState, useRef, useEffect } from "react";
import { differenceInDays, format } from "date-fns";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TimelineColorPicker } from "./TimelineColorPicker";
import { getCustomColorClasses } from "@/lib/timeline-colors";

import type { Database } from "@/integrations/supabase/types";

type InitiativeStatus = Database["public"]["Enums"]["initiative_status"];
type TaskStatus = Database["public"]["Enums"]["task_status"];
type CombinedStatus = InitiativeStatus | TaskStatus;

interface TimelineBarProps {
  startDate: Date;
  endDate: Date;
  getPositionForDate: (date: Date) => number;
  getDateForPosition: (position: number) => Date;
  dayWidth: number;
  canDrag: boolean;
  onDragEnd: (newStartDate: Date, newEndDate: Date) => void;
  onClick?: () => void;
  variant: "initiative" | "task";
  label: string;
  ownerName?: string;
  status?: CombinedStatus;
  customColor?: string | null;
  onColorChange?: (color: string | null) => void;
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getStatusColor = (variant: "initiative" | "task", status?: CombinedStatus): string => {
  if (!status) {
    return variant === "initiative"
      ? "bg-primary hover:bg-primary/90"
      : "bg-secondary hover:bg-secondary/90";
  }

  // Initiative status colors
  if (variant === "initiative") {
    switch (status) {
      case "not_started":
        return "bg-muted hover:bg-muted/90";
      case "in_progress":
        return "bg-info hover:bg-info/90";
      case "completed":
        return "bg-success hover:bg-success/90";
      case "blocked":
        return "bg-destructive hover:bg-destructive/90";
      default:
        return "bg-primary hover:bg-primary/90";
    }
  }

  // Task status colors (lighter variants)
  switch (status) {
    case "todo":
      return "bg-muted hover:bg-muted/90";
    case "in_progress":
      return "bg-info/70 hover:bg-info/60";
    case "done":
      return "bg-success/70 hover:bg-success/60";
    case "blocked":
      return "bg-destructive/70 hover:bg-destructive/60";
    default:
      return "bg-secondary hover:bg-secondary/90";
  }
};

const getTextColor = (variant: "initiative" | "task", status?: CombinedStatus): string => {
  if (!status) {
    return variant === "initiative" ? "text-primary-foreground" : "text-secondary-foreground";
  }

  if (variant === "initiative") {
    switch (status) {
      case "not_started":
        return "text-muted-foreground";
      case "in_progress":
        return "text-info-foreground";
      case "completed":
        return "text-success-foreground";
      case "blocked":
        return "text-destructive-foreground";
      default:
        return "text-primary-foreground";
    }
  }

  switch (status) {
    case "todo":
      return "text-muted-foreground";
    case "in_progress":
    case "done":
    case "blocked":
      return "text-foreground";
    default:
      return "text-secondary-foreground";
  }
};

type DragMode = "move" | "resize-start" | "resize-end" | null;

export function TimelineBar({
  startDate,
  endDate,
  getPositionForDate,
  getDateForPosition,
  dayWidth,
  canDrag,
  onDragEnd,
  onClick,
  variant,
  label,
  ownerName,
  status,
  customColor,
  onColorChange,
}: TimelineBarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [tempStart, setTempStart] = useState<Date>(startDate);
  const [tempEnd, setTempEnd] = useState<Date>(endDate);
  const barRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number>(0);
  const dragStartY = useRef<number>(0);
  const initialStart = useRef<Date>(startDate);
  const initialEnd = useRef<Date>(endDate);
  const hasMoved = useRef<boolean>(false);
  const CLICK_THRESHOLD = 5;

  const left = getPositionForDate(isDragging ? tempStart : startDate);
  const width = Math.max(
    dayWidth,
    getPositionForDate(isDragging ? tempEnd : endDate) -
      getPositionForDate(isDragging ? tempStart : startDate) +
      dayWidth
  );

  const handleMouseDown = (e: React.MouseEvent, mode: DragMode) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
    setDragMode(mode);
    dragStartX.current = e.clientX;
    dragStartY.current = e.clientY;
    initialStart.current = startDate;
    initialEnd.current = endDate;
    setTempStart(startDate);
    setTempEnd(endDate);
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

      const deltaDays = Math.round(deltaX / dayWidth);

      if (dragMode === "move") {
        const newStart = new Date(initialStart.current);
        newStart.setDate(newStart.getDate() + deltaDays);
        const newEnd = new Date(initialEnd.current);
        newEnd.setDate(newEnd.getDate() + deltaDays);
        setTempStart(newStart);
        setTempEnd(newEnd);
      } else if (dragMode === "resize-start") {
        const newStart = new Date(initialStart.current);
        newStart.setDate(newStart.getDate() + deltaDays);
        // Prevent start from going past end
        if (newStart <= initialEnd.current) {
          setTempStart(newStart);
        }
      } else if (dragMode === "resize-end") {
        const newEnd = new Date(initialEnd.current);
        newEnd.setDate(newEnd.getDate() + deltaDays);
        // Prevent end from going before start
        if (newEnd >= initialStart.current) {
          setTempEnd(newEnd);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragMode(null);

      // If no significant movement, treat as click
      if (!hasMoved.current && onClick) {
        onClick();
        return;
      }

      // Only trigger update if dates actually changed and dragging is allowed
      if (
        canDrag &&
        hasMoved.current &&
        (tempStart.getTime() !== startDate.getTime() ||
          tempEnd.getTime() !== endDate.getTime())
      ) {
        onDragEnd(tempStart, tempEnd);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragMode, tempStart, tempEnd, dayWidth, startDate, endDate, onDragEnd, onClick, canDrag]);

  // Use custom color if set, otherwise fall back to status-based color
  const customColorClasses = getCustomColorClasses(customColor, variant);
  const barColor = customColorClasses 
    ? `${customColorClasses.bg} ${customColorClasses.hover}` 
    : getStatusColor(variant, status);
  const textColor = customColorClasses 
    ? customColorClasses.text 
    : getTextColor(variant, status);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          ref={barRef}
          className={cn(
            "absolute h-6 rounded flex items-center group/bar cursor-pointer",
            barColor,
            canDrag && hasMoved.current && isDragging && "cursor-grabbing",
            isDragging && hasMoved.current && "opacity-80 shadow-lg"
          )}
          style={{
            left,
            width,
            top: "50%",
            transform: "translateY(-50%)",
          }}
          onMouseDown={(e) => handleMouseDown(e, "move")}
        >
          {/* Left resize handle */}
          {canDrag && (
            <div
              className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-black/20 rounded-l flex items-center justify-center opacity-0 group-hover/bar:opacity-100 transition-opacity"
              onMouseDown={(e) => handleMouseDown(e, "resize-start")}
            >
              <GripVertical className="h-3 w-3 text-primary-foreground" />
            </div>
          )}

          {/* Label */}
          <span
            className={cn(
              "px-2 text-xs font-medium truncate flex-1",
              textColor
            )}
          >
            {width > 60 ? label : ""}
          </span>

          {/* Color picker */}
          {onColorChange && (
            <TimelineColorPicker
              currentColor={customColor ?? null}
              onColorChange={onColorChange}
              disabled={!canDrag}
            />
          )}

          {/* Owner/Assignee initials */}
          {ownerName && width > 100 && (
            <div
              className={cn(
                "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-medium mr-2 flex-shrink-0 bg-black/10",
                textColor.replace("text-", "text-") + "/80"
              )}
            >
              {getInitials(ownerName)}
            </div>
          )}

          {/* Right resize handle */}
          {canDrag && (
            <div
              className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-black/20 rounded-r flex items-center justify-center opacity-0 group-hover/bar:opacity-100 transition-opacity"
              onMouseDown={(e) => handleMouseDown(e, "resize-end")}
            >
              <GripVertical className="h-3 w-3 text-primary-foreground" />
            </div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">
          {format(isDragging ? tempStart : startDate, "MMM d, yyyy")} -{" "}
          {format(isDragging ? tempEnd : endDate, "MMM d, yyyy")}
        </p>
        <p className="text-xs text-muted-foreground">
          {differenceInDays(isDragging ? tempEnd : endDate, isDragging ? tempStart : startDate) + 1}{" "}
          days
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
