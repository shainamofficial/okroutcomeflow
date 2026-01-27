import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InitiativeStatus } from "@/hooks/useInitiatives";
import { useOrgUsers } from "@/hooks/useOrgUsers";
import { useTeams } from "@/hooks/useTeams";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export interface TimelineFiltersState {
  status: InitiativeStatus | "all";
  ownerId: string | "all";
  assigneeUserId: string | "all";
  assigneeTeamId: string | "all";
  overdueOnly: boolean;
}

interface TimelineFiltersProps {
  filters: TimelineFiltersState;
  onFiltersChange: (filters: TimelineFiltersState) => void;
}

export function TimelineFilters({ filters, onFiltersChange }: TimelineFiltersProps) {
  const { users } = useOrgUsers();
  const { teams } = useTeams();

  const activeUsers = users.filter((u) => u.status === "active");

  const hasActiveFilters =
    filters.status !== "all" ||
    filters.ownerId !== "all" ||
    filters.assigneeUserId !== "all" ||
    filters.assigneeTeamId !== "all" ||
    filters.overdueOnly;

  const clearFilters = () => {
    onFiltersChange({
      status: "all",
      ownerId: "all",
      assigneeUserId: "all",
      assigneeTeamId: "all",
      overdueOnly: false,
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filters</span>
      </div>

      <Select
        value={filters.status}
        onValueChange={(v) => onFiltersChange({ ...filters, status: v as TimelineFiltersState["status"] })}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="not_started">Not Started</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="blocked">Blocked</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.ownerId}
        onValueChange={(v) => onFiltersChange({ ...filters, ownerId: v })}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Owner" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Owners</SelectItem>
          {activeUsers.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.name || user.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.assigneeUserId}
        onValueChange={(v) => onFiltersChange({ ...filters, assigneeUserId: v })}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Assignee User" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Users</SelectItem>
          {activeUsers.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.name || user.email}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.assigneeTeamId}
        onValueChange={(v) => onFiltersChange({ ...filters, assigneeTeamId: v })}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Team" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Teams</SelectItem>
          {teams.map((team) => (
            <SelectItem key={team.id} value={team.id}>
              {team.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <Switch
          id="overdue-filter-timeline"
          checked={filters.overdueOnly}
          onCheckedChange={(checked) => onFiltersChange({ ...filters, overdueOnly: checked })}
        />
        <Label htmlFor="overdue-filter-timeline" className="text-sm cursor-pointer">
          Overdue only
        </Label>
      </div>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
