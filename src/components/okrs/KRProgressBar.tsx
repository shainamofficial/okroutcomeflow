import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface KRProgressBarProps {
  progressPercent: number;
  expectedProgress: number;
  className?: string;
}

export function KRProgressBar({ progressPercent, expectedProgress, className }: KRProgressBarProps) {
  const progressValue = Math.round(progressPercent * 100);
  const expectedValue = Math.round(expectedProgress * 100);

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Progress</span>
        <span className="font-medium">{progressValue}%</span>
      </div>
      <div className="relative">
        <Progress value={progressValue} className="h-2" />
        {expectedProgress > 0 && expectedProgress < 1 && (
          <div
            className="absolute top-0 h-2 w-0.5 bg-foreground/50"
            style={{ left: `${expectedValue}%` }}
            title={`Expected: ${expectedValue}%`}
          />
        )}
      </div>
      <div className="text-xs text-muted-foreground">
        Expected by now: {expectedValue}%
      </div>
    </div>
  );
}
