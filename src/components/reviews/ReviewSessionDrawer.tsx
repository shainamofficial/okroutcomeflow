import { useState } from "react";
import { format, isPast, isToday } from "date-fns";
import { Calendar, Clock, User, Users, Target, ListTodo, FileText } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { CalendarIcon, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ReviewSession,
  useReviewSessions,
  useReviewParticipants,
} from "@/hooks/useReviews";
import { useKRInitiativeLinks } from "@/hooks/useInitiatives";
import { useTasks } from "@/hooks/useTasks";
import { useOrgUsers } from "@/hooks/useOrgUsers";
import { useAuth } from "@/contexts/AuthContext";
import { ReviewStatusBadge } from "./ReviewStatusBadge";
import { MetricChart } from "@/components/okrs/MetricChart";
import { useKRMetricConfig, useKRMetricValues } from "@/hooks/useKRMetrics";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface ReviewSessionDrawerProps {
  session: ReviewSession;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReviewSessionDrawer({
  session,
  open,
  onOpenChange,
}: ReviewSessionDrawerProps) {
  const { profile, roles } = useAuth();
  const { updateSession, deleteSession } = useReviewSessions(session.key_result_id);
  const { participants, addParticipant, removeParticipant } = useReviewParticipants(session.id);
  const { initiatives } = useKRInitiativeLinks(session.key_result_id);
  const { config: metricConfig } = useKRMetricConfig(session.key_result_id);
  const { values: metricValues } = useKRMetricValues(metricConfig?.id);
  const { users } = useOrgUsers();
  
  const [notes, setNotes] = useState(session.notes || "");
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>();
  const [showReschedule, setShowReschedule] = useState(false);
  const [showAddParticipant, setShowAddParticipant] = useState(false);

  const isAdmin = roles.includes("admin");
  const isManager = roles.includes("manager");
  const isKROwner = session.key_result?.owner_id === profile?.id;
  const canManage = isAdmin || isManager || isKROwner;

  const activeUsers = users.filter((u) => u.status === "active");
  const participantUserIds = new Set(participants.map((p) => p.user_id));
  const availableUsers = activeUsers.filter((u) => !participantUserIds.has(u.id));

  const isOverdue = session.status === "scheduled" && 
    isPast(new Date(session.review_date)) && 
    !isToday(new Date(session.review_date));

  const handleComplete = () => {
    updateSession.mutate({
      id: session.id,
      status: "completed",
      notes: notes || null,
      completedAt: new Date().toISOString(),
    });
  };

  const handleCancel = () => {
    updateSession.mutate({
      id: session.id,
      status: "cancelled",
    });
  };

  const handleReschedule = () => {
    if (!rescheduleDate) return;
    updateSession.mutate({
      id: session.id,
      reviewDate: format(rescheduleDate, "yyyy-MM-dd"),
      status: "scheduled",
    }, {
      onSuccess: () => {
        setShowReschedule(false);
        setRescheduleDate(undefined);
      },
    });
  };

  const handleSaveNotes = () => {
    updateSession.mutate({
      id: session.id,
      notes: notes || null,
    });
  };

  const handleAddParticipant = (userId: string) => {
    addParticipant.mutate({
      sessionId: session.id,
      userId,
    }, {
      onSuccess: () => setShowAddParticipant(false),
    });
  };

  // Get first initiative's tasks for snapshot
  const firstInitiativeId = initiatives[0]?.initiative?.id;
  const { tasks } = useTasks(firstInitiativeId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 flex-wrap">
            Review Session
            <ReviewStatusBadge status={session.status} />
            {isOverdue && (
              <Badge variant="destructive" className="text-xs">Overdue</Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            {format(new Date(session.review_date), "EEEE, MMMM d, yyyy")}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* KR Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <h3 className="font-medium">Key Result</h3>
            </div>
            <div className="p-3 border rounded-md bg-muted/30">
              <p className="font-medium">{session.key_result?.title}</p>
              {session.key_result?.owner && (
                <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>{session.key_result.owner.name || session.key_result.owner.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Metric Chart */}
          {metricConfig && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-medium">Metric Progress</h3>
                <MetricChart config={metricConfig} values={metricValues} />
              </div>
            </>
          )}

          <Separator />

          {/* Linked Initiatives Snapshot */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              <h3 className="font-medium">
                Linked Initiatives ({initiatives.length})
              </h3>
            </div>
            {initiatives.length === 0 ? (
              <p className="text-sm text-muted-foreground">No linked initiatives.</p>
            ) : (
              <div className="space-y-2">
                {initiatives.slice(0, 3).map((link) => (
                  <div key={link.id} className="p-2 border rounded-md text-sm">
                    <span className="font-medium">{link.initiative?.title}</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {link.initiative?.status}
                    </Badge>
                  </div>
                ))}
                {initiatives.length > 3 && (
                  <p className="text-sm text-muted-foreground">
                    +{initiatives.length - 3} more initiatives
                  </p>
                )}
              </div>
            )}

            {/* Tasks snapshot from first initiative */}
            {tasks.length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-muted-foreground mb-2">
                  Tasks ({tasks.length} total, {tasks.filter(t => t.status === "done").length} done)
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline">{tasks.filter(t => t.status === "todo").length} To Do</Badge>
                  <Badge variant="default">{tasks.filter(t => t.status === "in_progress").length} In Progress</Badge>
                  <Badge variant="destructive">{tasks.filter(t => t.status === "blocked").length} Blocked</Badge>
                  <Badge variant="secondary">{tasks.filter(t => t.status === "done").length} Done</Badge>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Participants */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <h3 className="font-medium">Participants ({participants.length})</h3>
              </div>
              {canManage && (
                <Popover open={showAddParticipant} onOpenChange={setShowAddParticipant}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[250px] p-0" align="end">
                    <Command>
                      <CommandInput placeholder="Search users..." />
                      <CommandList>
                        <CommandEmpty>No users available.</CommandEmpty>
                        <CommandGroup>
                          {availableUsers.map((user) => (
                            <CommandItem
                              key={user.id}
                              value={user.name || user.email}
                              onSelect={() => handleAddParticipant(user.id)}
                            >
                              {user.name || user.email}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            </div>
            {participants.length === 0 ? (
              <p className="text-sm text-muted-foreground">No participants added.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {participants.map((p) => (
                  <Badge key={p.id} variant="secondary" className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {p.user?.name || p.user?.email}
                    {canManage && (
                      <button
                        onClick={() => removeParticipant.mutate(p.id)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Notes */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <h3 className="font-medium">Notes</h3>
            </div>
            {canManage ? (
              <div className="space-y-2">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes for this review session..."
                  rows={4}
                />
                {notes !== (session.notes || "") && (
                  <Button size="sm" onClick={handleSaveNotes} disabled={updateSession.isPending}>
                    Save Notes
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {session.notes || "No notes."}
              </p>
            )}
          </div>

          {/* Actions */}
          {canManage && session.status === "scheduled" && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-medium">Actions</h3>
                
                {showReschedule ? (
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-[200px] justify-start text-left font-normal",
                            !rescheduleDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {rescheduleDate ? format(rescheduleDate, "MMM d, yyyy") : "Pick new date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={rescheduleDate}
                          onSelect={setRescheduleDate}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <Button onClick={handleReschedule} disabled={!rescheduleDate || updateSession.isPending}>
                      Confirm
                    </Button>
                    <Button variant="ghost" onClick={() => setShowReschedule(false)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={handleComplete} disabled={updateSession.isPending}>
                      Complete Review
                    </Button>
                    <Button variant="outline" onClick={() => setShowReschedule(true)}>
                      Reschedule
                    </Button>
                    <Button
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={handleCancel}
                      disabled={updateSession.isPending}
                    >
                      Cancel Review
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}

          {session.completed_at && (
            <p className="text-sm text-muted-foreground">
              Completed on {format(new Date(session.completed_at), "MMM d, yyyy 'at' h:mm a")}
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
