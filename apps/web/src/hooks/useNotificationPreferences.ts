import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
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
    queryFn: async () =>
      (await trpc.notifications.preferences.query()) as NotificationPreference[],
    enabled: !!profile?.id,
  });

  const getPreference = (type: string) => {
    const pref = preferences.find((p) => p.notification_type === type);
    return pref || { in_app_enabled: true, email_enabled: false };
  };

  const upsertPreference = useMutation({
    mutationFn: async (params: { notification_type: string; in_app_enabled: boolean; email_enabled: boolean }) => {
      await trpc.notifications.upsertPreference.mutate(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification_preferences"] });
    },
    onError: (e) => toast({ title: "Failed to update preference", description: e.message, variant: "destructive" }),
  });

  return { preferences, isLoading, getPreference, upsertPreference };
}
