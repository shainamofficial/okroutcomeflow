import { useMemo } from "react";
import { TaskDependency } from "@/hooks/useTaskDependencies";
import { TimelineInitiative } from "@/pages/Timeline";

interface TaskPosition {
  taskId: string;
  left: number;
  right: number;
  top: number;
}

interface TimelineDependencyArrowsProps {
  dependencies: TaskDependency[];
  initiatives: TimelineInitiative[];
  getPositionForDate: (date: Date) => number;
  dayWidth: number;
  stickyColumnWidth: number;
}

export function TimelineDependencyArrows({
  dependencies,
  initiatives,
  getPositionForDate,
  dayWidth,
  stickyColumnWidth,
}: TimelineDependencyArrowsProps) {
  const arrows = useMemo(() => {
    if (dependencies.length === 0) return [];

    // Build a map of task positions
    const taskPositions: Record<string, TaskPosition> = {};
    let rowIndex = 0;

    initiatives.forEach((initiative) => {
      rowIndex++; // initiative row
      initiative.tasks.forEach((task) => {
        const rowHeight = 41; // approx row height
        const centerY = rowIndex * rowHeight + rowHeight / 2;

        if (task.start_date && task.due_date) {
          const left = getPositionForDate(new Date(task.start_date));
          const right = getPositionForDate(new Date(task.due_date)) + dayWidth;
          taskPositions[task.id] = { taskId: task.id, left, right, top: centerY };
        } else if (task.due_date) {
          const pos = getPositionForDate(new Date(task.due_date));
          taskPositions[task.id] = { taskId: task.id, left: pos, right: pos + 12, top: centerY };
        }
        rowIndex++;
      });
    });

    // Generate arrow paths
    return dependencies
      .map((dep) => {
        const from = taskPositions[dep.depends_on_task_id];
        const to = taskPositions[dep.task_id];
        if (!from || !to) return null;

        const startX = from.right + stickyColumnWidth;
        const startY = from.top;
        const endX = to.left + stickyColumnWidth;
        const endY = to.top;

        // Create a curved path
        const midX = (startX + endX) / 2;
        const path = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;

        return {
          id: dep.id,
          path,
          endX,
          endY,
          type: dep.dependency_type,
        };
      })
      .filter(Boolean) as { id: string; path: string; endX: number; endY: number; type: string }[];
  }, [dependencies, initiatives, getPositionForDate, dayWidth, stickyColumnWidth]);

  if (arrows.length === 0) return null;

  return (
    <svg className="absolute inset-0 pointer-events-none z-[5]" style={{ overflow: "visible" }}>
      <defs>
        <marker
          id="arrowhead-blocks"
          markerWidth="8"
          markerHeight="6"
          refX="8"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 8 3, 0 6" className="fill-destructive" />
        </marker>
        <marker
          id="arrowhead-default"
          markerWidth="8"
          markerHeight="6"
          refX="8"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 8 3, 0 6" className="fill-muted-foreground" />
        </marker>
      </defs>
      {arrows.map((arrow) => (
        <path
          key={arrow.id}
          d={arrow.path}
          fill="none"
          strokeWidth={1.5}
          className={arrow.type === "blocks" ? "stroke-destructive" : "stroke-muted-foreground"}
          markerEnd={`url(#arrowhead-${arrow.type === "blocks" ? "blocks" : "default"})`}
          strokeDasharray={arrow.type === "blocks" ? undefined : "4 3"}
        />
      ))}
    </svg>
  );
}
