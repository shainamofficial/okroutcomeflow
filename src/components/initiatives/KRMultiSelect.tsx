import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { KeyResult } from "@/hooks/useOKRs";

interface KRMultiSelectProps {
  keyResults: KeyResult[];
  selectedKRs: { krId: string; weight?: number }[];
  onChange: (selected: { krId: string; weight?: number }[]) => void;
}

export function KRMultiSelect({
  keyResults,
  selectedKRs,
  onChange,
}: KRMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredKRs = useMemo(() => {
    if (!search) return keyResults;
    const searchLower = search.toLowerCase();
    return keyResults.filter((kr) =>
      kr.title.toLowerCase().includes(searchLower)
    );
  }, [keyResults, search]);

  const selectedIds = useMemo(
    () => new Set(selectedKRs.map((s) => s.krId)),
    [selectedKRs]
  );

  const handleSelect = (krId: string) => {
    if (selectedIds.has(krId)) {
      onChange(selectedKRs.filter((s) => s.krId !== krId));
    } else {
      onChange([...selectedKRs, { krId }]);
    }
  };

  const handleRemove = (krId: string) => {
    onChange(selectedKRs.filter((s) => s.krId !== krId));
  };

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
              ? `${selectedKRs.length} Key Result${selectedKRs.length !== 1 ? "s" : ""} selected`
              : "Select Key Results..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search Key Results..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>No Key Results found.</CommandEmpty>
              <CommandGroup>
                {filteredKRs.map((kr) => (
                  <CommandItem
                    key={kr.id}
                    value={kr.id}
                    onSelect={() => handleSelect(kr.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedIds.has(kr.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate">{kr.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedKRs.length > 0 && (
        <div className="space-y-2">
          {selectedKRs.map((selected) => (
            <div
              key={selected.krId}
              className="flex items-center gap-2 p-2 border rounded-md bg-muted/30"
            >
              <Badge variant="secondary" className="shrink-0">
                KR
              </Badge>
              <span className="flex-1 text-sm truncate">
                {getKRTitle(selected.krId)}
              </span>
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
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => handleRemove(selected.krId)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
