import { type ReactNode } from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface InfoTooltipProps {
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
  contentClassName?: string;
  iconSize?: number;
  label?: string;
}

export function InfoTooltip({
  children,
  side = "top",
  className,
  contentClassName,
  iconSize = 14,
  label = "More info",
}: InfoTooltipProps) {
  return (
    <Tooltip delayDuration={150}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={(e) => e.preventDefault()}
          className={cn(
            "inline-flex items-center justify-center align-middle ml-1 rounded-full text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 transition-colors",
            className,
          )}
        >
          <Info style={{ width: iconSize, height: iconSize }} />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        className={cn("max-w-xs text-xs leading-relaxed", contentClassName)}
      >
        {children}
      </TooltipContent>
    </Tooltip>
  );
}

export default InfoTooltip;
