import { useState } from "react";
import { Filter, X, ChevronDown, Calendar, Rows3, AlignJustify } from "lucide-react";
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
import { Toggle } from "@/components/ui/toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type ZoomLevel = "day" | "week" | "month" | "quarter";
export type GroupBy = "none" | "status" | "owner" | "team";
export type DensityMode = "compact" | "comfortable";

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
  groupBy: GroupBy;
  onGroupByChange: (groupBy: GroupBy) => void;
  density: DensityMode;
  onDensityChange: (density: DensityMode) => void;
  onScrollToToday: () => void;
}

export function TimelineFilters({
  filters,
  onFiltersChange,
  zoomLevel,
  onZoomLevelChange,
  groupBy,
  onGroupByChange,
  density,
  onDensityChange,
  onScrollToToday,
}: TimelineFiltersProps) {
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
      {/* Zoom level */}
      <Select
        value={zoomLevel}
        onValueChange={(v) => onZoomLevelChange(v as ZoomLevel)}
      >
        <SelectTrigger className="w-full sm:w-[120px]">
          <SelectValue placeholder="View" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="day">Day</SelectItem>
          <SelectItem value="week">Week</SelectItem>
          <SelectItem value="month">Month</SelectItem>
          <SelectItem value="quarter">Quarter</SelectItem>
        </SelectContent>
      </Select>

      {/* Group by */}
      <Select
        value={groupBy}
        onValueChange={(v) => onGroupByChange(v as GroupBy)}
      >
        <SelectTrigger className="w-full sm:w-[130px]">
          <SelectValue placeholder="Group by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No Grouping</SelectItem>
          <SelectItem value="status">By Status</SelectItem>
          <SelectItem value="owner">By Owner</SelectItem>
          <SelectItem value="team">By Team</SelectItem>
        </SelectContent>
      </Select>

      {/* Status filter */}
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

      {/* Owner filter */}
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

      {/* Assignee user filter */}
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

      {/* Team filter */}
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

  const toolbarActions = (
    <div className="flex items-center gap-1">
      {/* Scroll to today */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm" onClick={onScrollToToday} className="gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Today</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Scroll to today</TooltipContent>
      </Tooltip>

      {/* Density toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Toggle
            size="sm"
            pressed={density === "compact"}
            onPressedChange={(pressed) => onDensityChange(pressed ? "compact" : "comfortable")}
            aria-label="Toggle density"
          >
            {density === "compact" ? (
              <AlignJustify className="h-3.5 w-3.5" />
            ) : (
              <Rows3 className="h-3.5 w-3.5" />
            )}
          </Toggle>
        </TooltipTrigger>
        <TooltipContent>{density === "compact" ? "Comfortable view" : "Compact view"}</TooltipContent>
      </Tooltip>
    </div>
  );

  if (isMobile) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {toolbarActions}
        </div>
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
            <div className="p-3 rounded-xl shadow-card bg-card/80 backdrop-blur-sm">
              {filterContent}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl shadow-card bg-card/80 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold">Filters</span>
      </div>
      {filterContent}
      <div className="ml-auto">{toolbarActions}</div>
    </div>
  );
}
