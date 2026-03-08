import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Target, Lightbulb, CheckSquare, Flag,
  LayoutDashboard, ListTodo, Calendar, GanttChart, BarChart3,
  Users, Settings, Activity, Table2, Zap, Bell
} from "lucide-react";
import { useGlobalSearch, useSearchState } from "@/hooks/useGlobalSearch";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";

const navCommands = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/app", shortcut: "G D" },
  { label: "My Items", icon: ListTodo, path: "/app/me", shortcut: "G M" },
  { label: "OKRs", icon: Target, path: "/app/okrs", shortcut: "G O" },
  { label: "Initiatives", icon: Lightbulb, path: "/app/initiatives", shortcut: "G I" },
  { label: "Timeline", icon: GanttChart, path: "/app/timeline", shortcut: "G T" },
  { label: "Calendar", icon: Calendar, path: "/app/calendar" },
  { label: "Table View", icon: Table2, path: "/app/table" },
  { label: "Workload", icon: BarChart3, path: "/app/workload" },
  { label: "Reviews", icon: CheckSquare, path: "/app/reviews" },
  { label: "Activity Log", icon: Activity, path: "/app/activity" },
  { label: "Automations", icon: Zap, path: "/app/automations" },
  { label: "Notification Settings", icon: Settings, path: "/app/settings/notifications" },
  { label: "User Management", icon: Users, path: "/app/settings/users" },
  { label: "Team Management", icon: Users, path: "/app/settings/teams" },
  { label: "Organization Settings", icon: Settings, path: "/app/settings/organization" },
];

const typeIcons: Record<string, React.ReactNode> = {
  objective: <Flag className="h-4 w-4 text-muted-foreground" />,
  key_result: <Target className="h-4 w-4 text-muted-foreground" />,
  initiative: <Lightbulb className="h-4 w-4 text-muted-foreground" />,
  task: <CheckSquare className="h-4 w-4 text-muted-foreground" />,
};

export function CommandPalette() {
  const navigate = useNavigate();
  const { isOpen, query, setQuery, openSearch, closeSearch } = useSearchState();
  const { data: results, isLoading } = useGlobalSearch(query);

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

  const handleNavigate = useCallback((path: string) => {
    closeSearch();
    navigate(path);
  }, [closeSearch, navigate]);

  const handleSelect = useCallback((type: string) => {
    closeSearch();
    switch (type) {
      case "objective":
      case "key_result":
        navigate("/app/okrs");
        break;
      case "initiative":
      case "task":
        navigate("/app/initiatives");
        break;
    }
  }, [closeSearch, navigate]);

  const hasSearchResults = query.length >= 2 && results && (
    results.objectives.length > 0 ||
    results.keyResults.length > 0 ||
    results.initiatives.length > 0 ||
    results.tasks.length > 0
  );

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-9 sm:w-64 sm:justify-start sm:px-3 sm:py-2"
        onClick={openSearch}
      >
        <Search className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline-flex text-muted-foreground">Search or jump to...</span>
        <kbd className="pointer-events-none absolute right-2 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={isOpen} onOpenChange={(open) => !open && closeSearch()}>
        <CommandInput
          placeholder="Search or type a command..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {query.length >= 2 && !isLoading ? `No results for "${query}"` : "Type to search or browse commands"}
          </CommandEmpty>

          {/* Search results */}
          {hasSearchResults && (
            <>
              {results!.objectives.length > 0 && (
                <CommandGroup heading="Objectives">
                  {results!.objectives.map((r) => (
                    <CommandItem key={r.id} onSelect={() => handleSelect(r.type)}>
                      {typeIcons[r.type]}
                      <span className="ml-2">{r.title}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {results!.keyResults.length > 0 && (
                <CommandGroup heading="Key Results">
                  {results!.keyResults.map((r) => (
                    <CommandItem key={r.id} onSelect={() => handleSelect(r.type)}>
                      {typeIcons[r.type]}
                      <span className="ml-2">{r.title}</span>
                      {r.parentTitle && <span className="ml-auto text-xs text-muted-foreground">in {r.parentTitle}</span>}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {results!.initiatives.length > 0 && (
                <CommandGroup heading="Initiatives">
                  {results!.initiatives.map((r) => (
                    <CommandItem key={r.id} onSelect={() => handleSelect(r.type)}>
                      {typeIcons[r.type]}
                      <span className="ml-2">{r.title}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {results!.tasks.length > 0 && (
                <CommandGroup heading="Tasks">
                  {results!.tasks.map((r) => (
                    <CommandItem key={r.id} onSelect={() => handleSelect(r.type)}>
                      {typeIcons[r.type]}
                      <span className="ml-2">{r.title}</span>
                      {r.parentTitle && <span className="ml-auto text-xs text-muted-foreground">in {r.parentTitle}</span>}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              <CommandSeparator />
            </>
          )}

          {/* Navigation commands */}
          <CommandGroup heading="Navigation">
            {navCommands.map((cmd) => (
              <CommandItem key={cmd.path} onSelect={() => handleNavigate(cmd.path)}>
                <cmd.icon className="h-4 w-4 text-muted-foreground" />
                <span className="ml-2">{cmd.label}</span>
                {cmd.shortcut && (
                  <span className="ml-auto text-xs text-muted-foreground">{cmd.shortcut}</span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
