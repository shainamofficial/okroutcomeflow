import { useState } from "react";
import { Filter, X, ChevronDown } from "lucide-react";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";

export type ZoomLevel = "week" | "month" | "quarter";

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
  zoomLevel: ZoomLevel;
  onZoomLevelChange: (level: ZoomLevel) => void;
}

export function TimelineFilters({ filters, onFiltersChange, zoomLevel, onZoomLevelChange }: TimelineFiltersProps) {
  const { users } = useOrgUsers();
  const { teams } = useTeams();
  const isMobile = useIsMobile();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeUsers = users.filter((u) => u.status === "active");

  const hasActiveFilters =
    filters.status !== "all" ||
    filters.ownerId !== "all" ||
    filters.assigneeUserId !== "all" ||
    filters.assigneeTeamId !== "all" ||
    filters.overdueOnly;

  const activeFilterCount = [
    filters.status !== "all",
    filters.ownerId !== "all",
    filters.assigneeUserId !== "all",
    filters.assigneeTeamId !== "all",
    filters.overdueOnly,
  ].filter(Boolean).length;

  const clearFilters = () => {
    onFiltersChange({
      status: "all",
      ownerId: "all",
      assigneeUserId: "all",
      assigneeTeamId: "all",
      overdueOnly: false,
    });
  };

  const filterContent = (
    <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3">
      <Select
        value={zoomLevel}
        onValueChange={(v) => onZoomLevelChange(v as ZoomLevel)}
      >
        <SelectTrigger className="w-full sm:w-[120px]">
          <SelectValue placeholder="View" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="week">Week</SelectItem>
          <SelectItem value="month">Month</SelectItem>
          <SelectItem value="quarter">Quarter</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.status}
        onValueChange={(v) => onFiltersChange({ ...filters, status: v as TimelineFiltersState["status"] })}
      >
        <SelectTrigger className="w-full sm:w-[140px]">
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
        <SelectTrigger className="w-full sm:w-[160px]">
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
        <SelectTrigger className="w-full sm:w-[160px]">
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
        <SelectTrigger className="w-full sm:w-[140px]">
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

  if (isMobile) {
    return (
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 w-full justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">{activeFilterCount}</Badge>
              )}
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          <div className="p-3 border rounded-lg bg-muted/30">
            {filterContent}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filters</span>
      </div>
      {filterContent}
    </div>
  );
}
