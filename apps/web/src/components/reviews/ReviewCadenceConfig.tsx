import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarClock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useReviewCadence,
  ReviewFrequency,
  calculateNextReviewDate,
} from "@/hooks/useReviews";
import { InfoTooltip } from "@/components/ui/InfoTooltip";

const DAYS_OF_WEEK = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

interface ReviewCadenceConfigProps {
  keyResultId: string;
  canManage: boolean;
}

export function ReviewCadenceConfig({ keyResultId, canManage }: ReviewCadenceConfigProps) {
  const { cadence, isLoading, upsertCadence, deleteCadence } = useReviewCadence(keyResultId);
  
  const [frequency, setFrequency] = useState<ReviewFrequency>("weekly");
  const [dayOfWeek, setDayOfWeek] = useState<string>("1");
  const [time, setTime] = useState("09:00");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (cadence) {
      setFrequency(cadence.frequency);
      setDayOfWeek(cadence.day_of_week?.toString() || "1");
      setTime(cadence.time);
      setHasChanges(false);
    }
  }, [cadence]);

  const handleSave = () => {
    upsertCadence.mutate({
      keyResultId,
      frequency,
      dayOfWeek: frequency === "weekly" || frequency === "biweekly" ? parseInt(dayOfWeek) : null,
      time,
    }, {
      onSuccess: () => setHasChanges(false),
    });
  };

  const handleDelete = () => {
    deleteCadence.mutate(keyResultId);
  };

  const handleChange = <T,>(setter: (v: T) => void) => (value: T) => {
    setter(value);
    setHasChanges(true);
  };

  const handleFrequencyChange = (value: string) => {
    setFrequency(value as ReviewFrequency);
    setHasChanges(true);
  };

  const showDayOfWeek = frequency === "weekly" || frequency === "biweekly";

  const previewNextDate = calculateNextReviewDate(
    frequency,
    showDayOfWeek ? parseInt(dayOfWeek) : null
  );

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            <CardTitle className="text-base inline-flex items-center">
              Review Cadence
              <InfoTooltip>
                A <strong>Cadence</strong> is a recurring rule. Each time it fires, it creates a{" "}
                <strong>Session</strong> — one specific review instance with its own notes and
                status.
              </InfoTooltip>
            </CardTitle>
          </div>
          {cadence && canManage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={deleteCadence.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardDescription>
          {cadence
            ? `Next review: ${format(new Date(cadence.next_review_date), "MMM d, yyyy")} at ${cadence.time}`
            : "Set up a recurring review schedule for this Key Result."}
        </CardDescription>
      </CardHeader>
      
      {canManage && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="inline-flex items-center">
                Frequency
                <InfoTooltip>
                  How often the cadence fires. Weekly is best for tactical KRs; biweekly or
                  monthly works for slower-moving strategic ones.
                </InfoTooltip>
              </Label>
              <Select 
                value={frequency} 
                onValueChange={handleFrequencyChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Biweekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {showDayOfWeek && (
              <div className="space-y-2">
                <Label>Day of Week</Label>
                <Select value={dayOfWeek} onValueChange={handleChange(setDayOfWeek)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day.value} value={day.value}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Time</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => handleChange(setTime)(e.target.value)}
              />
            </div>
          </div>

          {hasChanges && (
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">
                Next review would be: {format(previewNextDate, "MMM d, yyyy")}
              </span>
              <Button
                onClick={handleSave}
                disabled={upsertCadence.isPending}
                size="sm"
              >
                {upsertCadence.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
