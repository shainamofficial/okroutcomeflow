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
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="metric-name">Metric Name</Label>
          <Input
            id="metric-name"
            value={metricName}
            onChange={(e) => setMetricName(e.target.value)}
            placeholder="e.g., Revenue"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit">Unit</Label>
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
        <Label htmlFor="direction">Direction</Label>
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
          <Label htmlFor="start-value">Start Value</Label>
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
          <Label htmlFor="target-value">Target Value</Label>
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
          <Label>Start Date</Label>
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
          <Label>End Date</Label>
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
