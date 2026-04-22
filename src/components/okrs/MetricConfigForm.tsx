import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { KRMetricConfig, MetricDirection, useKRMetricConfig } from "@/hooks/useKRMetrics";
import { InfoTooltip } from "@/components/ui/InfoTooltip";

interface MetricConfigFormProps {
  keyResultId: string;
  config: KRMetricConfig | null;
  onClose: () => void;
}

export function MetricConfigForm({ keyResultId, config, onClose }: MetricConfigFormProps) {
  const { createConfig, updateConfig } = useKRMetricConfig(keyResultId);

  const [metricName, setMetricName] = useState(config?.metric_name || "");
  const [unit, setUnit] = useState(config?.unit || "");
  const [direction, setDirection] = useState<MetricDirection>(config?.direction || "increase");
  const [startValue, setStartValue] = useState(config?.start_value?.toString() || "0");
  const [targetValue, setTargetValue] = useState(config?.target_value?.toString() || "100");
  const [startDate, setStartDate] = useState<Date | undefined>(
    config?.start_date ? new Date(config.start_date) : new Date()
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    config?.end_date ? new Date(config.end_date) : undefined
  );

  useEffect(() => {
    if (config) {
      setMetricName(config.metric_name);
      setUnit(config.unit);
      setDirection(config.direction);
      setStartValue(config.start_value.toString());
      setTargetValue(config.target_value.toString());
      setStartDate(new Date(config.start_date));
      setEndDate(new Date(config.end_date));
    }
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!metricName.trim() || !unit.trim() || !startDate || !endDate) return;

    const configData = {
      key_result_id: keyResultId,
      metric_name: metricName.trim(),
      unit: unit.trim(),
      direction,
      start_value: parseFloat(startValue) || 0,
      target_value: parseFloat(targetValue) || 0,
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: format(endDate, "yyyy-MM-dd"),
    };

    if (config) {
      await updateConfig.mutateAsync({ id: config.id, ...configData });
    } else {
      await createConfig.mutateAsync(configData);
    }
    onClose();
  };

  const isPending = createConfig.isPending || updateConfig.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
        Configuring a metric lets the app calculate progress automatically. Progress moves linearly from <strong>Start Value</strong> to <strong>Target Value</strong> between the start and end dates, and status is based on how close today's value is to that line.
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="metric-name" className="flex items-center">
            Metric Name
            <InfoTooltip>
              The thing you're measuring. Examples: MRR, Active Buyers, NPS, Checkout Conversion.
            </InfoTooltip>
          </Label>
          <Input
            id="metric-name"
            value={metricName}
            onChange={(e) => setMetricName(e.target.value)}
            placeholder="e.g., Monthly Active Buyers"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit" className="flex items-center">
            Unit
            <InfoTooltip>
              How the metric is counted. Examples: USD, %, users, NPS, hours, ms.
            </InfoTooltip>
          </Label>
          <Input
            id="unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="e.g., USD, %, users"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="direction" className="flex items-center">
          Direction
          <InfoTooltip>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>Increase</strong> — higher is better (revenue, signups, NPS)</li>
              <li><strong>Decrease</strong> — lower is better (churn, latency, defects)</li>
              <li><strong>Maintain</strong> — stay within a band (uptime ≥ 99.9%)</li>
            </ul>
          </InfoTooltip>
        </Label>
        <Select value={direction} onValueChange={(v) => setDirection(v as MetricDirection)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="increase">Increase</SelectItem>
            <SelectItem value="decrease">Decrease</SelectItem>
            <SelectItem value="maintain">Maintain</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start-value" className="flex items-center">
            Start Value
            <InfoTooltip>
              Where you are today — the baseline. This represents 0% progress. Example: current MAU = 200.
            </InfoTooltip>
          </Label>
          <Input
            id="start-value"
            type="number"
            step="any"
            value={startValue}
            onChange={(e) => setStartValue(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="target-value" className="flex items-center">
            Target Value
            <InfoTooltip>
              Where you want to be by the end date. This represents 100% progress. Example: target MAU = 500.
            </InfoTooltip>
          </Label>
          <Input
            id="target-value"
            type="number"
            step="any"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center">
            Start Date
            <InfoTooltip>
              When tracking begins. Progress is expected to move linearly from Start Value on this date to Target Value on the End Date.
            </InfoTooltip>
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label className="flex items-center">
            End Date
            <InfoTooltip>
              The deadline. "On Track" means today's value is at or above the expected line for today's date. Usually end of quarter.
            </InfoTooltip>
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : config ? "Update" : "Save"}
        </Button>
      </div>
    </form>
  );
}
