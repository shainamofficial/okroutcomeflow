import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { addDays, addWeeks, addMonths, nextDay, format } from "date-fns";

export type ReviewFrequency = "weekly" | "biweekly" | "monthly" | "quarterly";
export type ReviewSessionStatus = "scheduled" | "completed" | "cancelled";

export interface ReviewCadence {
  id: string;
  key_result_id: string;
  frequency: ReviewFrequency;
  day_of_week: number | null;
  time: string;
  next_review_date: string;
  created_at: string;
}

export interface ReviewSession {
  id: string;
  key_result_id: string;
  review_date: string;
  status: ReviewSessionStatus;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  key_result?: {
    id: string;
    title: string;
    owner_id: string | null;
    owner?: {
      id: string;
      name: string;
      email: string;
    } | null;
  };
  participants?: ReviewParticipant[];
}

export interface ReviewParticipant {
  id: string;
  review_session_id: string;
  user_id: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

// Calculate next review date based on frequency
export function calculateNextReviewDate(
  frequency: ReviewFrequency,
  dayOfWeek: number | null,
  fromDate: Date = new Date()
): Date {
  const today = fromDate;
  
  switch (frequency) {
    case "weekly":
      if (dayOfWeek !== null) {
        const next = nextDay(today, dayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6);
        return next <= today ? addWeeks(next, 1) : next;
      }
      return addWeeks(today, 1);
      
    case "biweekly":
      if (dayOfWeek !== null) {
        const next = nextDay(today, dayOfWeek as 0 | 1 | 2 | 3 | 4 | 5 | 6);
        return next <= today ? addWeeks(next, 2) : addWeeks(next, 1);
      }
      return addWeeks(today, 2);
      
    case "monthly":
      return addMonths(today, 1);
      
    case "quarterly":
      return addMonths(today, 3);
      
    default:
      return addWeeks(today, 1);
  }
}

export function useReviewCadence(keyResultId?: string) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cadence, isLoading } = useQuery({
    queryKey: ["review_cadence", keyResultId],
    queryFn: async () => {
      if (!keyResultId) return null;

      const { data, error } = await supabase
        .from("kr_review_cadence")
        .select("*")
        .eq("key_result_id", keyResultId)
        .maybeSingle();

      if (error) throw error;
      return data as ReviewCadence | null;
    },
    enabled: !!keyResultId && !!profile?.organization_id,
  });

  const upsertCadence = useMutation({
    mutationFn: async (params: {
      keyResultId: string;
      frequency: ReviewFrequency;
      dayOfWeek?: number | null;
      time?: string;
    }) => {
      const nextReviewDate = calculateNextReviewDate(
        params.frequency,
        params.dayOfWeek ?? null
      );

      const nextReviewDateStr = format(nextReviewDate, "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("kr_review_cadence")
        .upsert({
          key_result_id: params.keyResultId,
          frequency: params.frequency,
          day_of_week: params.dayOfWeek ?? null,
          time: params.time || "09:00",
          next_review_date: nextReviewDateStr,
        }, {
          onConflict: "key_result_id",
        })
        .select()
        .single();

      if (error) throw error;

      // Check if a scheduled session already exists for this date
      const { data: existingSession } = await supabase
        .from("kr_review_sessions")
        .select("id")
        .eq("key_result_id", params.keyResultId)
        .eq("review_date", nextReviewDateStr)
        .eq("status", "scheduled")
        .maybeSingle();

      // Create a new review session if one doesn't exist
      if (!existingSession) {
        await supabase
          .from("kr_review_sessions")
          .insert({
            key_result_id: params.keyResultId,
            review_date: nextReviewDateStr,
            status: "scheduled",
          });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review_cadence"] });
      queryClient.invalidateQueries({ queryKey: ["review_sessions"] });
      queryClient.invalidateQueries({ queryKey: ["all_review_sessions"] });
      toast({ title: "Review cadence saved" });
    },
    onError: (error) => {
      toast({
        title: "Failed to save cadence",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCadence = useMutation({
    mutationFn: async (keyResultId: string) => {
      const { error } = await supabase
        .from("kr_review_cadence")
        .delete()
        .eq("key_result_id", keyResultId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review_cadence"] });
      toast({ title: "Review cadence removed" });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove cadence",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    cadence,
    isLoading,
    upsertCadence,
    deleteCadence,
  };
}

export function useReviewSessions(keyResultId?: string) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["review_sessions", keyResultId],
    queryFn: async () => {
      if (!keyResultId) return [];

      const { data, error } = await supabase
        .from("kr_review_sessions")
        .select(`
          *,
          key_result:key_results(
            id, title, owner_id,
            owner:users_profile!key_results_owner_id_fkey(id, name, email)
          )
        `)
        .eq("key_result_id", keyResultId)
        .order("review_date", { ascending: true });

      if (error) throw error;
      return data as ReviewSession[];
    },
    enabled: !!keyResultId && !!profile?.organization_id,
  });

  const createSession = useMutation({
    mutationFn: async (params: {
      keyResultId: string;
      reviewDate: string;
      status?: ReviewSessionStatus;
    }) => {
      const { data, error } = await supabase
        .from("kr_review_sessions")
        .insert({
          key_result_id: params.keyResultId,
          review_date: params.reviewDate,
          status: params.status || "scheduled",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review_sessions"] });
      queryClient.invalidateQueries({ queryKey: ["all_review_sessions"] });
      toast({ title: "Review session created" });
    },
    onError: (error) => {
      toast({
        title: "Failed to create session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateSession = useMutation({
    mutationFn: async (params: {
      id: string;
      reviewDate?: string;
      status?: ReviewSessionStatus;
      notes?: string | null;
      completedAt?: string | null;
    }) => {
      const updateData: Record<string, unknown> = {};
      if (params.reviewDate !== undefined) updateData.review_date = params.reviewDate;
      if (params.status !== undefined) updateData.status = params.status;
      if (params.notes !== undefined) updateData.notes = params.notes;
      if (params.completedAt !== undefined) updateData.completed_at = params.completedAt;

      const { error } = await supabase
        .from("kr_review_sessions")
        .update(updateData)
        .eq("id", params.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review_sessions"] });
      queryClient.invalidateQueries({ queryKey: ["all_review_sessions"] });
      toast({ title: "Review session updated" });
    },
    onError: (error) => {
      toast({
        title: "Failed to update session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteSession = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("kr_review_sessions")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review_sessions"] });
      queryClient.invalidateQueries({ queryKey: ["all_review_sessions"] });
      toast({ title: "Review session deleted" });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    sessions,
    isLoading,
    createSession,
    updateSession,
    deleteSession,
  };
}

export function useAllReviewSessions() {
  const { profile } = useAuth();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["all_review_sessions", profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];

      const { data, error } = await supabase
        .from("kr_review_sessions")
        .select(`
          *,
          key_result:key_results!inner(
            id, title, owner_id, organization_id,
            owner:users_profile!key_results_owner_id_fkey(id, name, email)
          )
        `)
        .eq("key_result.organization_id", profile.organization_id)
        .order("review_date", { ascending: true });

      if (error) throw error;
      return data as (ReviewSession & { key_result: { organization_id: string } })[];
    },
    enabled: !!profile?.organization_id,
  });

  return { sessions, isLoading };
}

export function useReviewParticipants(sessionId?: string) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: participants = [], isLoading } = useQuery({
    queryKey: ["review_participants", sessionId],
    queryFn: async () => {
      if (!sessionId) return [];

      const { data, error } = await supabase
        .from("kr_review_participants")
        .select(`
          *,
          user:users_profile(id, name, email)
        `)
        .eq("review_session_id", sessionId);

      if (error) throw error;
      return data as ReviewParticipant[];
    },
    enabled: !!sessionId && !!profile?.organization_id,
  });

  const addParticipant = useMutation({
    mutationFn: async (params: { sessionId: string; userId: string }) => {
      const { data, error } = await supabase
        .from("kr_review_participants")
        .insert({
          review_session_id: params.sessionId,
          user_id: params.userId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review_participants"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to add participant",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeParticipant = useMutation({
    mutationFn: async (participantId: string) => {
      const { error } = await supabase
        .from("kr_review_participants")
        .delete()
        .eq("id", participantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review_participants"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove participant",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    participants,
    isLoading,
    addParticipant,
    removeParticipant,
  };
}
