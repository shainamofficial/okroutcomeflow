import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type MetricDirection = "increase" | "decrease" | "maintain";

export interface KRMetricConfig {
  id: string;
  key_result_id: string;
  metric_name: string;
  unit: string;
  direction: MetricDirection;
  start_value: number;
  target_value: number;
  start_date: string;
  end_date: string;
}

export interface KRMetricValue {
  id: string;
  kr_metric_config_id: string;
  date: string;
  value: number;
  created_by: string | null;
  created_at: string;
}

export type KRStatus = "no_config" | "no_data" | "on_track" | "at_risk" | "off_track";

export interface KRProgress {
  currentValue: number | null;
  progressPercent: number;
  expectedProgress: number;
  status: KRStatus;
}

export function calculateProgress(
  config: KRMetricConfig | null,
  values: KRMetricValue[]
): KRProgress {
  if (!config) {
    return { currentValue: null, progressPercent: 0, expectedProgress: 0, status: "no_config" };
  }

  if (values.length === 0) {
    return { currentValue: null, progressPercent: 0, expectedProgress: 0, status: "no_data" };
  }

  // Get most recent value by date
  const sortedValues = [...values].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const currentValue = sortedValues[0].value;

  // Calculate progress based on direction
  let progressPercent = 0;
  const { direction, start_value, target_value } = config;

  if (direction === "increase") {
    const denominator = target_value - start_value;
    progressPercent = denominator !== 0 ? (currentValue - start_value) / denominator : 0;
  } else if (direction === "decrease") {
    const denominator = start_value - target_value;
    progressPercent = denominator !== 0 ? (start_value - currentValue) / denominator : 0;
  } else if (direction === "maintain") {
    const maxDiff = Math.max(Math.abs(target_value), 1);
    progressPercent = 1 - Math.abs(currentValue - target_value) / maxDiff;
  }

  // Clamp between 0 and 1
  progressPercent = Math.max(0, Math.min(1, progressPercent));

  // Calculate expected progress by time
  const startDate = new Date(config.start_date);
  const endDate = new Date(config.end_date);
  const today = new Date();

  const totalDays = Math.max(1, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const elapsedDays = Math.max(0, (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const expectedProgress = Math.min(1, elapsedDays / totalDays);

  // Determine status
  let status: KRStatus;
  if (progressPercent >= expectedProgress) {
    status = "on_track";
  } else if (progressPercent >= expectedProgress - 0.1) {
    status = "at_risk";
  } else {
    status = "off_track";
  }

  return { currentValue, progressPercent, expectedProgress, status };
}

export function useKRMetricConfig(keyResultId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ["kr-metric-config", keyResultId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kr_metric_config")
        .select("*")
        .eq("key_result_id", keyResultId)
        .maybeSingle();

      if (error) throw error;
      return data as KRMetricConfig | null;
    },
    enabled: !!keyResultId,
  });

  const createConfig = useMutation({
    mutationFn: async (configData: Omit<KRMetricConfig, "id">) => {
      const { data, error } = await supabase
        .from("kr_metric_config")
        .insert(configData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kr-metric-config", keyResultId] });
      toast({ title: "Metric configuration saved" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save metric configuration",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateConfig = useMutation({
    mutationFn: async ({ id, ...configData }: KRMetricConfig) => {
      const { error } = await supabase
        .from("kr_metric_config")
        .update(configData)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kr-metric-config", keyResultId] });
      toast({ title: "Metric configuration updated" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update metric configuration",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteConfig = useMutation({
    mutationFn: async (configId: string) => {
      const { error } = await supabase
        .from("kr_metric_config")
        .delete()
        .eq("id", configId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kr-metric-config", keyResultId] });
      queryClient.invalidateQueries({ queryKey: ["kr-metric-values"] });
      toast({ title: "Metric configuration deleted" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete metric configuration",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return { config, isLoading, createConfig, updateConfig, deleteConfig };
}

export function useKRMetricValues(configId: string | undefined) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: values = [], isLoading } = useQuery({
    queryKey: ["kr-metric-values", configId],
    queryFn: async () => {
      if (!configId) return [];
      const { data, error } = await supabase
        .from("kr_metric_values")
        .select("*")
        .eq("kr_metric_config_id", configId)
        .order("date", { ascending: true });

      if (error) throw error;
      return data as KRMetricValue[];
    },
    enabled: !!configId,
  });

  const addValue = useMutation({
    mutationFn: async ({ date, value }: { date: string; value: number }) => {
      if (!configId || !profile?.id) throw new Error("Missing config or user");

      const { data, error } = await supabase
        .from("kr_metric_values")
        .insert({
          kr_metric_config_id: configId,
          date,
          value,
          created_by: profile.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ date, value }) => {
      await queryClient.cancelQueries({ queryKey: ["kr-metric-values", configId] });
      const previous = queryClient.getQueryData<KRMetricValue[]>(["kr-metric-values", configId]);
      const optimistic: KRMetricValue = {
        id: `optimistic-${date}-${value}`,
        kr_metric_config_id: configId ?? "",
        date,
        value,
        created_by: profile?.id ?? null,
        created_at: new Date().toISOString(),
      };
      queryClient.setQueryData<KRMetricValue[]>(["kr-metric-values", configId], (old) =>
        [...(old ?? []), optimistic].sort((a, b) => a.date.localeCompare(b.date))
      );
      return { previous };
    },
    onSuccess: () => {
      toast({ title: "Metric value added" });
    },
    onError: (error: Error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["kr-metric-values", configId], context.previous);
      }
      toast({
        title: "Failed to add metric value",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["kr-metric-values", configId] });
    },
  });

  const deleteValue = useMutation({
    mutationFn: async (valueId: string) => {
      const { error } = await supabase
        .from("kr_metric_values")
        .delete()
        .eq("id", valueId);

      if (error) throw error;
    },
    onMutate: async (valueId) => {
      await queryClient.cancelQueries({ queryKey: ["kr-metric-values", configId] });
      const previous = queryClient.getQueryData<KRMetricValue[]>(["kr-metric-values", configId]);
      queryClient.setQueryData<KRMetricValue[]>(["kr-metric-values", configId], (old) =>
        (old ?? []).filter((v) => v.id !== valueId)
      );
      return { previous };
    },
    onSuccess: () => {
      toast({ title: "Metric value deleted" });
    },
    onError: (error: Error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["kr-metric-values", configId], context.previous);
      }
      toast({
        title: "Failed to delete metric value",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["kr-metric-values", configId] });
    },
  });

  return { values, isLoading, addValue, deleteValue };
}
