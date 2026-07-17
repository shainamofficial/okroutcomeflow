import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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

      return (await trpc.search.global.query({ query: trimmedQuery })) as GroupedSearchResults;
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
