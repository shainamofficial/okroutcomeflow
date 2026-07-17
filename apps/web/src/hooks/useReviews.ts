import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
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
      return (await trpc.reviews.cadence.query({ keyResultId })) as ReviewCadence | null;
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
      return await trpc.reviews.upsertCadence.mutate({
        keyResultId: params.keyResultId,
        frequency: params.frequency,
        dayOfWeek: params.dayOfWeek ?? null,
        time: params.time || "09:00",
        nextReviewDate: nextReviewDateStr,
      });
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
      await trpc.reviews.deleteCadence.mutate({ keyResultId });
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
      return (await trpc.reviews.sessions.query({ keyResultId })) as ReviewSession[];
    },
    enabled: !!keyResultId && !!profile?.organization_id,
  });

  const createSession = useMutation({
    mutationFn: async (params: {
      keyResultId: string;
      reviewDate: string;
      status?: ReviewSessionStatus;
    }) => {
      return await trpc.reviews.createSession.mutate({
        keyResultId: params.keyResultId,
        reviewDate: params.reviewDate,
        status: params.status,
      });
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
      await trpc.reviews.updateSession.mutate({
        id: params.id,
        reviewDate: params.reviewDate,
        status: params.status,
        notes: params.notes,
        completedAt: params.completedAt,
      });
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
      await trpc.reviews.deleteSession.mutate({ id });
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
      return (await trpc.reviews.allSessions.query()) as (ReviewSession & {
        key_result: { organization_id: string };
      })[];
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
      return (await trpc.reviews.participants.query({ sessionId })) as ReviewParticipant[];
    },
    enabled: !!sessionId && !!profile?.organization_id,
  });

  const addParticipant = useMutation({
    mutationFn: async (params: { sessionId: string; userId: string }) => {
      return await trpc.reviews.addParticipant.mutate({
        sessionId: params.sessionId,
        userId: params.userId,
      });
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
      await trpc.reviews.removeParticipant.mutate({ participantId });
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
