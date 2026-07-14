import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  description?: string;
  className?: string;
  accentColor?: string;
}

export function StatCard({ title, value, icon, description, className, accentColor }: StatCardProps) {
  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-200 hover:shadow-card-hover border-border/60",
      className
    )}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold font-display tracking-tight">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
            "bg-accent text-accent-foreground"
          )}>
            {icon}
          </div>
        </div>
      </CardContent>
      {/* Accent bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 gradient-primary opacity-0 group-hover:opacity-100 transition-opacity" />
    </Card>
  );
}
