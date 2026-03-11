import { Check, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  TIMELINE_COLORS, 
  TIMELINE_COLOR_KEYS, 
  TimelineColorKey 
} from "@/lib/timeline-colors";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface TimelineColorPickerProps {
  currentColor: string | null;
  onColorChange: (color: string | null) => void;
  disabled?: boolean;
}

export function TimelineColorPicker({
  currentColor,
  onColorChange,
  disabled = false,
}: TimelineColorPickerProps) {
  const handleColorSelect = (color: TimelineColorKey | null) => {
    onColorChange(color);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-6 w-6 opacity-0 group-hover/bar:opacity-100 transition-opacity",
            disabled && "pointer-events-none"
          )}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          disabled={disabled}
        >
          {currentColor && currentColor in TIMELINE_COLORS ? (
            <div 
              className={cn(
                "h-4 w-4 rounded-full border border-white/50",
                TIMELINE_COLORS[currentColor as TimelineColorKey].swatch
              )} 
            />
          ) : (
            <Palette className="h-4 w-4 text-white/80" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-2 animate-scale-in" 
        align="start"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="grid grid-cols-5 gap-1">
          {/* Default option */}
          <button
            onClick={() => handleColorSelect(null)}
            className={cn(
              "h-7 w-7 rounded-md border-2 flex items-center justify-center",
              "bg-gradient-to-br from-muted to-primary/30",
              "hover:ring-2 hover:ring-ring hover:ring-offset-1",
              !currentColor && "ring-2 ring-ring ring-offset-1"
            )}
            title="Default (status-based)"
          >
            {!currentColor && <Check className="h-4 w-4 text-foreground" />}
          </button>

          {/* Color options */}
          {TIMELINE_COLOR_KEYS.map((colorKey) => (
            <button
              key={colorKey}
              onClick={() => handleColorSelect(colorKey)}
              className={cn(
                "h-7 w-7 rounded-md flex items-center justify-center",
                "hover:ring-2 hover:ring-ring hover:ring-offset-1",
                TIMELINE_COLORS[colorKey].swatch,
                currentColor === colorKey && "ring-2 ring-ring ring-offset-1"
              )}
              title={colorKey.charAt(0).toUpperCase() + colorKey.slice(1)}
            >
              {currentColor === colorKey && (
                <Check className={cn("h-4 w-4", TIMELINE_COLORS[colorKey].text)} />
              )}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Select a color or use default
        </p>
      </PopoverContent>
    </Popover>
  );
}
