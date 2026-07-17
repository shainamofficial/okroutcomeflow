import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
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
      return (await trpc.customFields.definitions.query({
        entityType,
      })) as unknown as CustomFieldDefinition[];
    },
    enabled: !!profile?.organization_id,
  });

  const createDefinition = useMutation({
    mutationFn: async (params: { name: string; field_type: CustomFieldType; options?: string[] }) => {
      return await trpc.customFields.createDefinition.mutate({
        entityType,
        name: params.name,
        fieldType: params.field_type,
        options: params.options || [],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom_field_definitions"] });
      toast({ title: "Custom field created" });
    },
    onError: (e) => toast({ title: "Failed to create field", description: e.message, variant: "destructive" }),
  });

  const deleteDefinition = useMutation({
    mutationFn: async (id: string) => {
      await trpc.customFields.deleteDefinition.mutate({ id });
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
      return (await trpc.customFields.values.query({
        entityIds,
      })) as unknown as CustomFieldValue[];
    },
    enabled: entityIds.length > 0,
  });

  const upsertValue = useMutation({
    mutationFn: async (params: { field_definition_id: string; entity_type: string; entity_id: string; value: unknown }) => {
      await trpc.customFields.upsertValue.mutate({
        fieldDefinitionId: params.field_definition_id,
        entityType: params.entity_type as "kr" | "initiative" | "task",
        entityId: params.entity_id,
        value: params.value,
      });
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
