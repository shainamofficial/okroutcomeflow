import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface InitiativeProgressBarProps {
  total: number;
  done: number;
  className?: string;
  showLabel?: boolean;
}

export function InitiativeProgressBar({ total, done, className, showLabel = true }: InitiativeProgressBarProps) {
  if (total === 0) return null;
  const pct = Math.round((done / total) * 100);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Progress value={pct} className="h-1.5 flex-1" />
      {showLabel && (
        <span className="text-[10px] font-medium text-muted-foreground tabular-nums whitespace-nowrap">
          {pct}%
        </span>
      )}
    </div>
  );
}
