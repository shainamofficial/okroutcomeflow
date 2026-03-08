import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type CustomFieldType = "text" | "number" | "select" | "multi_select" | "date" | "checkbox";

export interface CustomFieldDefinition {
  id: string;
  organization_id: string;
  name: string;
  field_type: CustomFieldType;
  options: string[];
  entity_type: "kr" | "initiative" | "task";
  created_by: string | null;
  created_at: string;
}

export interface CustomFieldValue {
  id: string;
  field_definition_id: string;
  entity_type: string;
  entity_id: string;
  value: unknown;
  updated_at: string;
}

export function useCustomFields(entityType: "kr" | "initiative" | "task") {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: definitions = [], isLoading: loadingDefs } = useQuery({
    queryKey: ["custom_field_definitions", profile?.organization_id, entityType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_field_definitions")
        .select("*")
        .eq("organization_id", profile!.organization_id!)
        .eq("entity_type", entityType)
        .order("created_at");
      if (error) throw error;
      return data as unknown as CustomFieldDefinition[];
    },
    enabled: !!profile?.organization_id,
  });

  const createDefinition = useMutation({
    mutationFn: async (params: { name: string; field_type: CustomFieldType; options?: string[] }) => {
      const { data, error } = await supabase
        .from("custom_field_definitions")
        .insert({
          organization_id: profile!.organization_id!,
          name: params.name,
          field_type: params.field_type as any,
          options: params.options || [],
          entity_type: entityType as any,
          created_by: profile!.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom_field_definitions"] });
      toast({ title: "Custom field created" });
    },
    onError: (e) => toast({ title: "Failed to create field", description: e.message, variant: "destructive" }),
  });

  const deleteDefinition = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("custom_field_definitions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom_field_definitions"] });
      queryClient.invalidateQueries({ queryKey: ["custom_field_values"] });
      toast({ title: "Custom field deleted" });
    },
  });

  return { definitions, loadingDefs, createDefinition, deleteDefinition };
}

export function useCustomFieldValues(entityIds: string[]) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: values = [], isLoading: loadingValues } = useQuery({
    queryKey: ["custom_field_values", JSON.stringify(entityIds.slice().sort())],
    queryFn: async () => {
      if (entityIds.length === 0) return [];
      const { data, error } = await supabase
        .from("custom_field_values")
        .select("*")
        .in("entity_id", entityIds);
      if (error) throw error;
      return data as unknown as CustomFieldValue[];
    },
    enabled: entityIds.length > 0,
  });

  const upsertValue = useMutation({
    mutationFn: async (params: { field_definition_id: string; entity_type: string; entity_id: string; value: unknown }) => {
      const { error } = await supabase
        .from("custom_field_values")
        .upsert(
          {
            field_definition_id: params.field_definition_id,
            entity_type: params.entity_type as any,
            entity_id: params.entity_id,
            value: params.value as any,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "field_definition_id,entity_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom_field_values"] });
    },
    onError: (e) => toast({ title: "Failed to update field", description: e.message, variant: "destructive" }),
  });

  // Helper to get value for a specific field+entity
  const getValue = (fieldId: string, entityId: string) => {
    return values.find((v) => v.field_definition_id === fieldId && v.entity_id === entityId)?.value;
  };

  return { values, loadingValues, upsertValue, getValue };
}
