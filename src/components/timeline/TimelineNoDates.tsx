import { TimelineInitiative } from "@/pages/Timeline";
import { InitiativeStatusBadge } from "@/components/initiatives/InitiativeStatusBadge";
import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge";
import { CalendarX } from "lucide-react";

interface TimelineNoDatesProps {
  initiatives: TimelineInitiative[];
}

export function TimelineNoDates({ initiatives }: TimelineNoDatesProps) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <CalendarX className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-medium">No Dates Set</h3>
        <span className="text-sm text-muted-foreground">
          ({initiatives.length} initiative{initiatives.length !== 1 ? "s" : ""})
        </span>
      </div>

      <div className="space-y-3">
        {initiatives.map((initiative) => (
          <div key={initiative.id} className="border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium">{initiative.title}</span>
              <InitiativeStatusBadge status={initiative.status} />
            </div>
            {initiative.owner && (
              <p className="text-xs text-muted-foreground mb-2">
                Owner: {initiative.owner.name || initiative.owner.email}
              </p>
            )}

            {initiative.tasks.length > 0 && (
              <div className="pl-4 border-l-2 border-muted space-y-2 mt-2">
                {initiative.tasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-2">
                    <span className="text-sm">{task.title}</span>
                    <TaskStatusBadge status={task.status} />
                    {(task.assignee_user || task.assignee_team) && (
                      <span className="text-xs text-muted-foreground">
                        ({task.assignee_user
                          ? task.assignee_user.name || task.assignee_user.email
                          : task.assignee_team?.name})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
