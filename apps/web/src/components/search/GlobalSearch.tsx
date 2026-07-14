import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Target, Lightbulb, CheckSquare, Flag } from "lucide-react";
import { useGlobalSearch, useSearchState } from "@/hooks/useGlobalSearch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function GlobalSearch() {
  const navigate = useNavigate();
  const { isOpen, query, setQuery, openSearch, closeSearch } = useSearchState();
  const { data: results, isLoading } = useGlobalSearch(query);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openSearch();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [openSearch]);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const handleSelect = (type: string, id: string) => {
    closeSearch();
    switch (type) {
      case "objective":
      case "key_result":
        navigate("/app/okrs");
        break;
      case "initiative":
        navigate("/app/initiatives");
        break;
      case "task":
        navigate("/app/initiatives");
        break;
    }
  };

  const totalResults =
    (results?.objectives.length || 0) +
    (results?.keyResults.length || 0) +
    (results?.initiatives.length || 0) +
    (results?.tasks.length || 0);

  const hasResults = totalResults > 0;

  return (
    <>
      {/* Search Trigger Button */}
      <Button
        variant="outline"
        className="relative h-9 w-9 sm:w-64 sm:justify-start sm:px-3 sm:py-2"
        onClick={openSearch}
      >
        <Search className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline-flex text-muted-foreground">
          Search...
        </span>
        <kbd className="pointer-events-none absolute right-2 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* Search Dialog */}
      <Dialog open={isOpen} onOpenChange={(open) => !open && closeSearch()}>
        <DialogContent className="sm:max-w-[550px] p-0 gap-0">
          <DialogTitle className="sr-only">Search</DialogTitle>
          
          {/* Search Input */}
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 shrink-0 opacity-50" />
            <Input
              ref={inputRef}
              placeholder="Search objectives, KRs, initiatives, tasks..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex h-12 w-full border-0 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto p-2">
            {query.length < 2 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search
              </p>
            )}

            {query.length >= 2 && isLoading && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Searching...
              </p>
            )}

            {query.length >= 2 && !isLoading && !hasResults && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No results found for "{query}"
              </p>
            )}

            {hasResults && (
              <div className="space-y-4">
                {/* Objectives */}
                {results?.objectives && results.objectives.length > 0 && (
                  <ResultGroup
                    title="Objectives"
                    icon={<Flag className="h-4 w-4" />}
                    results={results.objectives}
                    onSelect={handleSelect}
                  />
                )}

                {/* Key Results */}
                {results?.keyResults && results.keyResults.length > 0 && (
                  <ResultGroup
                    title="Key Results"
                    icon={<Target className="h-4 w-4" />}
                    results={results.keyResults}
                    onSelect={handleSelect}
                  />
                )}

                {/* Initiatives */}
                {results?.initiatives && results.initiatives.length > 0 && (
                  <ResultGroup
                    title="Initiatives"
                    icon={<Lightbulb className="h-4 w-4" />}
                    results={results.initiatives}
                    onSelect={handleSelect}
                  />
                )}

                {/* Tasks */}
                {results?.tasks && results.tasks.length > 0 && (
                  <ResultGroup
                    title="Tasks"
                    icon={<CheckSquare className="h-4 w-4" />}
                    results={results.tasks}
                    onSelect={handleSelect}
                  />
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface ResultGroupProps {
  title: string;
  icon: React.ReactNode;
  results: Array<{
    id: string;
    type: string;
    title: string;
    parentTitle?: string;
  }>;
  onSelect: (type: string, id: string) => void;
}

function ResultGroup({ title, icon, results, onSelect }: ResultGroupProps) {
  return (
    <div>
      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-2">
        {icon}
        {title}
      </div>
      <div className="space-y-1">
        {results.map((result) => (
          <button
            key={result.id}
            onClick={() => onSelect(result.type, result.id)}
            className={cn(
              "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none",
              "hover:bg-accent hover:text-accent-foreground",
              "focus:bg-accent focus:text-accent-foreground"
            )}
          >
            <div className="flex flex-col items-start">
              <span className="font-medium">{result.title}</span>
              {result.parentTitle && (
                <span className="text-xs text-muted-foreground">
                  in {result.parentTitle}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
