// App-level Postgres enum types, kept in a `Database['public']['Enums']` shape
// so the components that reference them resolve without churn. The API's
// Drizzle schema (apps/api/src/db/schema.ts) is the source of truth.
export interface Database {
  public: {
    Enums: {
      app_role: "admin" | "manager" | "contributor" | "viewer";
      automation_action:
        | "change_initiative_status"
        | "change_task_status"
        | "send_notification"
        | "create_update";
      automation_trigger:
        | "task_status_change"
        | "all_tasks_done"
        | "initiative_status_change"
        | "due_date_passed";
      custom_field_type: "text" | "number" | "select" | "multi_select" | "date" | "checkbox";
      entity_type: "kr" | "initiative" | "task";
      initiative_status: "not_started" | "in_progress" | "completed" | "blocked";
      invitation_status: "pending" | "accepted" | "revoked";
      metric_direction: "increase" | "decrease" | "maintain";
      notification_type: "mention" | "review_reminder" | "task_assigned" | "task_overdue";
      review_frequency: "weekly" | "biweekly" | "monthly" | "quarterly";
      review_session_status: "scheduled" | "completed" | "cancelled";
      task_status: "todo" | "in_progress" | "blocked" | "done";
      update_kind: "comment" | "progress" | "blocker" | "decision";
      user_status: "pending" | "active" | "inactive";
    };
  };
}
