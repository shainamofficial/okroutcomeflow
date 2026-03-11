import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Diamond, Palette, Check } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { 
  TIMELINE_COLORS, 
  TIMELINE_COLOR_KEYS, 
  TimelineColorKey,
  getCustomColorClasses 
} from "@/lib/timeline-colors";

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
  customColor?: string | null;
  onColorChange?: (color: string | null) => void;
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
  customColor,
  onColorChange,
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

  // Determine color - use custom color or fall back to variant-based
  const customColorClasses = getCustomColorClasses(customColor, variant);
  const iconColor = customColorClasses 
    ? customColorClasses.bg.replace("bg-", "text-")
    : variant === "initiative" ? "text-primary" : "text-secondary";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          ref={markerRef}
          className={cn(
            "absolute flex items-center justify-center cursor-pointer group/milestone",
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
            className={cn(
              "h-5 w-5 fill-current drop-shadow-[0_0_4px_hsl(var(--primary)/0.4)] transition-transform duration-200",
              iconColor,
              isDragging && "opacity-80",
              !isDragging && "hover:scale-110"
            )}
          />
          
          {/* Color picker button */}
          {onColorChange && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -top-3 -right-3 h-5 w-5 opacity-0 group-hover/milestone:opacity-100 transition-opacity bg-background border shadow-sm"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  disabled={!canDrag}
                >
                  {customColor && customColor in TIMELINE_COLORS ? (
                    <div 
                      className={cn(
                        "h-3 w-3 rounded-full",
                        TIMELINE_COLORS[customColor as TimelineColorKey].swatch
                      )} 
                    />
                  ) : (
                    <Palette className="h-3 w-3" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-auto p-2" 
                align="start"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="grid grid-cols-5 gap-1">
                  {/* Default option */}
                  <button
                    onClick={() => onColorChange(null)}
                    className={cn(
                      "h-6 w-6 rounded-md border-2 flex items-center justify-center",
                      "bg-gradient-to-br from-muted to-primary/30",
                      "hover:ring-2 hover:ring-ring hover:ring-offset-1",
                      !customColor && "ring-2 ring-ring ring-offset-1"
                    )}
                    title="Default"
                  >
                    {!customColor && <Check className="h-3 w-3 text-foreground" />}
                  </button>

                  {/* Color options */}
                  {TIMELINE_COLOR_KEYS.map((colorKey) => (
                    <button
                      key={colorKey}
                      onClick={() => onColorChange(colorKey)}
                      className={cn(
                        "h-6 w-6 rounded-md flex items-center justify-center",
                        "hover:ring-2 hover:ring-ring hover:ring-offset-1",
                        TIMELINE_COLORS[colorKey].swatch,
                        customColor === colorKey && "ring-2 ring-ring ring-offset-1"
                      )}
                      title={colorKey.charAt(0).toUpperCase() + colorKey.slice(1)}
                    >
                      {customColor === colorKey && (
                        <Check className={cn("h-3 w-3", TIMELINE_COLORS[colorKey].text)} />
                      )}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
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
