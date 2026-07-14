import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";

export interface SearchResult {
  id: string;
  type: "objective" | "key_result" | "initiative" | "task";
  title: string;
  description?: string;
  parentId?: string;
  parentTitle?: string;
}

export interface GroupedSearchResults {
  objectives: SearchResult[];
  keyResults: SearchResult[];
  initiatives: SearchResult[];
  tasks: SearchResult[];
}

export function useGlobalSearch(searchQuery: string) {
  const { profile } = useAuth();
  const trimmedQuery = searchQuery.trim().toLowerCase();

  return useQuery({
    queryKey: ["global_search", profile?.organization_id, trimmedQuery],
    queryFn: async (): Promise<GroupedSearchResults> => {
      if (!profile?.organization_id || !trimmedQuery) {
        return { objectives: [], keyResults: [], initiatives: [], tasks: [] };
      }

      if (trpc) {
        return (await trpc.search.global.query({
          query: trimmedQuery,
        })) as GroupedSearchResults;
      }

      // Search all entities in parallel
      const [objectives, keyResults, initiatives, tasks] = await Promise.all([
        supabase
          .from("objectives")
          .select("id, title, description")
          .eq("organization_id", profile.organization_id)
          .ilike("title", `%${trimmedQuery}%`)
          .limit(5),
        supabase
          .from("key_results")
          .select("id, title, description, objective_id, objective:objectives(title)")
          .eq("organization_id", profile.organization_id)
          .ilike("title", `%${trimmedQuery}%`)
          .limit(5),
        supabase
          .from("initiatives")
          .select("id, title, description")
          .eq("organization_id", profile.organization_id)
          .ilike("title", `%${trimmedQuery}%`)
          .limit(5),
        supabase
          .from("tasks")
          .select("id, title, description, initiative_id, initiative:initiatives!inner(title, organization_id)")
          .eq("initiative.organization_id", profile.organization_id)
          .ilike("title", `%${trimmedQuery}%`)
          .limit(5),
      ]);

      return {
        objectives: (objectives.data || []).map((o) => ({
          id: o.id,
          type: "objective" as const,
          title: o.title,
          description: o.description || undefined,
        })),
        keyResults: (keyResults.data || []).map((kr) => ({
          id: kr.id,
          type: "key_result" as const,
          title: kr.title,
          description: kr.description || undefined,
          parentId: kr.objective_id || undefined,
          parentTitle: (kr.objective as { title: string } | null)?.title,
        })),
        initiatives: (initiatives.data || []).map((i) => ({
          id: i.id,
          type: "initiative" as const,
          title: i.title,
          description: i.description || undefined,
        })),
        tasks: (tasks.data || []).map((t) => ({
          id: t.id,
          type: "task" as const,
          title: t.title,
          description: t.description || undefined,
          parentId: t.initiative_id,
          parentTitle: (t.initiative as { title: string } | null)?.title,
        })),
      };
    },
    enabled: !!profile?.organization_id && trimmedQuery.length >= 2,
    staleTime: 1000,
  });
}

export function useSearchState() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const openSearch = () => setIsOpen(true);
  const closeSearch = () => {
    setIsOpen(false);
    setQuery("");
  };

  return {
    isOpen,
    query,
    setQuery,
    openSearch,
    closeSearch,
  };
}
