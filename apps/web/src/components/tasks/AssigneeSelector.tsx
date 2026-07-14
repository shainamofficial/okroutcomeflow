import { useState } from "react";
import { Check, ChevronsUpDown, User, Users, X } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { useOrgUsers } from "@/hooks/useOrgUsers";
import { useTeams } from "@/hooks/useTeams";

export type AssigneeType = "user" | "team" | null;

interface AssigneeSelectorProps {
  assigneeType: AssigneeType;
  assigneeId: string | null;
  onAssigneeChange: (type: AssigneeType, id: string | null) => void;
}

export function AssigneeSelector({
  assigneeType,
  assigneeId,
  onAssigneeChange,
}: AssigneeSelectorProps) {
  const [open, setOpen] = useState(false);
  const { users } = useOrgUsers();
  const { teams } = useTeams();

  const activeUsers = users.filter((u) => u.status === "active");

  const getDisplayValue = () => {
    if (!assigneeType || !assigneeId) return "Unassigned";
    if (assigneeType === "user") {
      const user = activeUsers.find((u) => u.id === assigneeId);
      return user ? user.name || user.email : "Unknown User";
    }
    if (assigneeType === "team") {
      const team = teams.find((t) => t.id === assigneeId);
      return team ? team.name : "Unknown Team";
    }
    return "Unassigned";
  };

  const handleSelect = (type: AssigneeType, id: string | null) => {
    onAssigneeChange(type, id);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAssigneeChange(null, null);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span className="flex items-center gap-2 truncate">
            {assigneeType === "user" && <User className="h-4 w-4 shrink-0" />}
            {assigneeType === "team" && <Users className="h-4 w-4 shrink-0" />}
            <span className="truncate">{getDisplayValue()}</span>
          </span>
          <div className="flex items-center gap-1">
            {(assigneeType || assigneeId) && (
              <X
                className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
                onClick={handleClear}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search users or teams..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Users">
              {activeUsers.map((user) => (
                <CommandItem
                  key={user.id}
                  value={`user-${user.name || user.email}`}
                  onSelect={() => handleSelect("user", user.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      assigneeType === "user" && assigneeId === user.id
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  <User className="mr-2 h-4 w-4" />
                  <span className="truncate">{user.name || user.email}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Teams">
              {teams.map((team) => (
                <CommandItem
                  key={team.id}
                  value={`team-${team.name}`}
                  onSelect={() => handleSelect("team", team.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      assigneeType === "team" && assigneeId === team.id
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  <Users className="mr-2 h-4 w-4" />
                  <span className="truncate">{team.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
