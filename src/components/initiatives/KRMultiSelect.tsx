import { useState, useMemo, useCallback } from "react";
import { Check, ChevronsUpDown, X, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { KeyResult, Objective } from "@/hooks/useOKRs";
import {
  getKRAncestors,
  hasSelectedDescendants,
  buildKRTree,
  flattenKRTree,
  getKRNestingLevel,
} from "@/lib/kr-hierarchy";
import { toast } from "sonner";

interface KRMultiSelectProps {
  keyResults: KeyResult[];
  objectives: Objective[];
  selectedKRs: { krId: string; weight?: number; autoLinked?: boolean }[];
  onChange: (selected: { krId: string; weight?: number; autoLinked?: boolean }[]) => void;
}

export function KRMultiSelect({
  keyResults,
  objectives,
  selectedKRs,
  onChange,
}: KRMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Build hierarchical structure for display
  const flatKRItems = useMemo(() => {
    const tree = buildKRTree(keyResults, objectives);
    return flattenKRTree(tree, objectives);
  }, [keyResults, objectives]);

  // Filter based on search
  const filteredItems = useMemo(() => {
    if (!search) return flatKRItems;
    const searchLower = search.toLowerCase();
    return flatKRItems.filter((item) =>
      item.kr.title.toLowerCase().includes(searchLower)
    );
  }, [flatKRItems, search]);

  // Group filtered items by objective
  const groupedItems = useMemo(() => {
    const groups = new Map<string, typeof filteredItems>();
    for (const item of filteredItems) {
      const objId = item.objectiveId;
      if (!groups.has(objId)) {
        groups.set(objId, []);
      }
      groups.get(objId)!.push(item);
    }
    return groups;
  }, [filteredItems]);

  const selectedIds = useMemo(
    () => new Set(selectedKRs.map((s) => s.krId)),
    [selectedKRs]
  );

  const autoLinkedIds = useMemo(
    () => new Set(selectedKRs.filter((s) => s.autoLinked).map((s) => s.krId)),
    [selectedKRs]
  );

  const handleSelect = useCallback(
    (krId: string) => {
      if (selectedIds.has(krId)) {
        // Deselecting - check if this KR has selected descendants
        if (hasSelectedDescendants(krId, keyResults, selectedIds)) {
          toast.error(
            "Cannot deselect this KR while its sub-KRs are still linked"
          );
          return;
        }

        // Remove this KR and any auto-linked ancestors that no longer have selected descendants
        const newSelection = selectedKRs.filter((s) => {
          if (s.krId === krId) return false;

          // If this is an auto-linked parent, check if it still has selected descendants
          if (s.autoLinked) {
            const remainingIds = new Set(
              selectedKRs.filter((x) => x.krId !== krId).map((x) => x.krId)
            );
            return hasSelectedDescendants(s.krId, keyResults, remainingIds);
          }

          return true;
        });

        onChange(newSelection);
      } else {
        // Selecting - auto-add all ancestors
        const ancestors = getKRAncestors(krId, keyResults);
        const newSelection = [...selectedKRs];

        for (const ancestorId of ancestors) {
          if (!selectedIds.has(ancestorId)) {
            newSelection.push({
              krId: ancestorId,
              autoLinked: ancestorId !== krId,
            });
          }
        }

        onChange(newSelection);
      }
    },
    [selectedIds, selectedKRs, keyResults, onChange]
  );

  const handleRemove = useCallback(
    (krId: string) => {
      // Check if this KR has selected descendants
      if (hasSelectedDescendants(krId, keyResults, selectedIds)) {
        toast.error(
          "Cannot remove this KR while its sub-KRs are still linked"
        );
        return;
      }

      // Remove this KR and any auto-linked ancestors that no longer have selected descendants
      const newSelection = selectedKRs.filter((s) => {
        if (s.krId === krId) return false;

        // If this is an auto-linked parent, check if it still has selected descendants
        if (s.autoLinked) {
          const remainingIds = new Set(
            selectedKRs.filter((x) => x.krId !== krId).map((x) => x.krId)
          );
          return hasSelectedDescendants(s.krId, keyResults, remainingIds);
        }

        return true;
      });

      onChange(newSelection);
    },
    [selectedKRs, keyResults, selectedIds, onChange]
  );

  const handleWeightChange = (krId: string, weight: string) => {
    const numWeight = weight ? parseFloat(weight) : undefined;
    onChange(
      selectedKRs.map((s) =>
        s.krId === krId ? { ...s, weight: numWeight } : s
      )
    );
  };

  const getKRTitle = (krId: string) => {
    return keyResults.find((kr) => kr.id === krId)?.title || "Unknown";
  };

  const getObjectiveTitle = (objectiveId: string) => {
    return objectives.find((o) => o.id === objectiveId)?.title || "Unknown Objective";
  };

  // Sort selected KRs by nesting level for display
  const sortedSelectedKRs = useMemo(() => {
    return [...selectedKRs].sort((a, b) => {
      const levelA = getKRNestingLevel(a.krId, keyResults);
      const levelB = getKRNestingLevel(b.krId, keyResults);
      return levelA - levelB;
    });
  }, [selectedKRs, keyResults]);

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedKRs.length > 0
              ? `${selectedKRs.length} Key Result${selectedKRs.length !== 1 ? "s" : ""} linked`
              : "Select Key Results..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full min-w-[400px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search Key Results..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList className="max-h-[300px]">
              <CommandEmpty>No Key Results found.</CommandEmpty>
              {Array.from(groupedItems.entries()).map(([objId, items]) => (
                <CommandGroup key={objId} heading={getObjectiveTitle(objId)}>
                  {items.map((item) => {
                    const isSelected = selectedIds.has(item.kr.id);
                    const isAutoLinked = autoLinkedIds.has(item.kr.id);
                    return (
                      <CommandItem
                        key={item.kr.id}
                        value={item.kr.id}
                        onSelect={() => handleSelect(item.kr.id)}
                        className="flex items-center"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4 shrink-0",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span
                          className="truncate"
                          style={{ marginLeft: `${item.level * 16}px` }}
                        >
                          {item.kr.title}
                        </span>
                        {isAutoLinked && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link className="ml-2 h-3 w-3 text-muted-foreground shrink-0" />
                              </TooltipTrigger>
                              <TooltipContent>
                                Auto-linked via sub-KR
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {sortedSelectedKRs.length > 0 && (
        <div className="space-y-2">
          {sortedSelectedKRs.map((selected) => {
            const level = getKRNestingLevel(selected.krId, keyResults);
            const isAutoLinked = selected.autoLinked;
            return (
              <div
                key={selected.krId}
                className={cn(
                  "flex items-center gap-2 p-2 border rounded-md",
                  isAutoLinked ? "bg-muted/20 border-dashed" : "bg-muted/30"
                )}
                style={{ marginLeft: `${level * 12}px` }}
              >
                <Badge
                  variant={isAutoLinked ? "outline" : "secondary"}
                  className="shrink-0"
                >
                  {isAutoLinked ? (
                    <span className="flex items-center gap-1">
                      <Link className="h-3 w-3" />
                      KR
                    </span>
                  ) : (
                    "KR"
                  )}
                </Badge>
                <span className="flex-1 text-sm truncate">
                  {getKRTitle(selected.krId)}
                </span>
                {!isAutoLinked && (
                  <Input
                    type="number"
                    placeholder="Weight"
                    value={selected.weight ?? ""}
                    onChange={(e) =>
                      handleWeightChange(selected.krId, e.target.value)
                    }
                    className="w-20 h-8 text-sm"
                    step="0.1"
                    min="0"
                  />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => handleRemove(selected.krId)}
                  disabled={isAutoLinked}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
