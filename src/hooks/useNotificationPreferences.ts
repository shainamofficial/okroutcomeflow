import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface NotificationPreference {
  id: string;
  user_id: string;
  notification_type: string;
  in_app_enabled: boolean;
  email_enabled: boolean;
}

const NOTIFICATION_TYPES = [
  { type: "mention", label: "Mentions", description: "When someone mentions you in an update" },
  { type: "task_assigned", label: "Task Assigned", description: "When a task is assigned to you" },
  { type: "task_overdue", label: "Task Overdue", description: "When a task you own is overdue" },
  { type: "review_reminder", label: "Review Reminder", description: "Upcoming review session reminders" },
];

export { NOTIFICATION_TYPES };

export function useNotificationPreferences() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: preferences = [], isLoading } = useQuery({
    queryKey: ["notification_preferences", profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", profile!.id);
      if (error) throw error;
      return data as unknown as NotificationPreference[];
    },
    enabled: !!profile?.id,
  });

  const getPreference = (type: string) => {
    const pref = preferences.find((p) => p.notification_type === type);
    return pref || { in_app_enabled: true, email_enabled: false };
  };

  const upsertPreference = useMutation({
    mutationFn: async (params: { notification_type: string; in_app_enabled: boolean; email_enabled: boolean }) => {
      const { error } = await supabase
        .from("notification_preferences")
        .upsert(
          {
            user_id: profile!.id,
            notification_type: params.notification_type,
            in_app_enabled: params.in_app_enabled,
            email_enabled: params.email_enabled,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,notification_type" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification_preferences"] });
    },
    onError: (e) => toast({ title: "Failed to update preference", description: e.message, variant: "destructive" }),
  });

  return { preferences, isLoading, getPreference, upsertPreference };
}
