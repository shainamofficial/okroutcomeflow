import { pgTable, foreignKey, unique, pgPolicy, uuid, text, boolean, timestamp, numeric, date, check, integer, index, jsonb, bigint, pgView, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const appRole = pgEnum("app_role", ['admin', 'manager', 'contributor', 'viewer'])
export const automationAction = pgEnum("automation_action", ['change_initiative_status', 'change_task_status', 'send_notification', 'create_update'])
export const automationTrigger = pgEnum("automation_trigger", ['task_status_change', 'all_tasks_done', 'initiative_status_change', 'due_date_passed'])
export const customFieldType = pgEnum("custom_field_type", ['text', 'number', 'select', 'multi_select', 'date', 'checkbox'])
export const entityType = pgEnum("entity_type", ['kr', 'initiative', 'task'])
export const initiativeStatus = pgEnum("initiative_status", ['not_started', 'in_progress', 'completed', 'blocked'])
export const invitationStatus = pgEnum("invitation_status", ['pending', 'accepted', 'revoked'])
export const metricDirection = pgEnum("metric_direction", ['increase', 'decrease', 'maintain'])
export const notificationType = pgEnum("notification_type", ['mention', 'review_reminder', 'task_assigned', 'task_overdue'])
export const reviewFrequency = pgEnum("review_frequency", ['weekly', 'biweekly', 'monthly', 'quarterly'])
export const reviewSessionStatus = pgEnum("review_session_status", ['scheduled', 'completed', 'cancelled'])
export const taskStatus = pgEnum("task_status", ['todo', 'in_progress', 'blocked', 'done'])
export const updateKind = pgEnum("update_kind", ['comment', 'progress', 'blocker', 'decision'])
export const userStatus = pgEnum("user_status", ['pending', 'active', 'inactive'])


export const notificationPreferences = pgTable("notification_preferences", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	notificationType: text("notification_type").notNull(),
	inAppEnabled: boolean("in_app_enabled").default(true).notNull(),
	emailEnabled: boolean("email_enabled").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersProfile.id],
			name: "notification_preferences_user_id_fkey"
		}).onDelete("cascade"),
	unique("notification_preferences_user_id_notification_type_key").on(table.userId, table.notificationType),
	pgPolicy("Users can view their own notification preferences", { as: "permissive", for: "select", to: ["authenticated"], using: sql`(is_platform_admin(auth.uid()) OR (user_id = auth.uid()))` }),
	pgPolicy("Users can manage their own notification preferences", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const krMetricConfig = pgTable("kr_metric_config", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	keyResultId: uuid("key_result_id").notNull(),
	metricName: text("metric_name").notNull(),
	unit: text().notNull(),
	direction: metricDirection().notNull(),
	startValue: numeric("start_value").notNull(),
	targetValue: numeric("target_value").notNull(),
	startDate: date("start_date").notNull(),
	endDate: date("end_date").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.keyResultId],
			foreignColumns: [keyResults.id],
			name: "kr_metric_config_key_result_id_fkey"
		}).onDelete("cascade"),
	unique("kr_metric_config_unique").on(table.keyResultId),
	pgPolicy("Users can view org kr metric configs", { as: "permissive", for: "select", to: ["public"], using: sql`(is_platform_admin(auth.uid()) OR (EXISTS ( SELECT 1
   FROM key_results kr
  WHERE ((kr.id = kr_metric_config.key_result_id) AND (kr.organization_id = get_user_org_id(auth.uid()))))))` }),
	pgPolicy("Managers and owners can create kr metric configs", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Managers and owners can update kr metric configs", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Managers and owners can delete kr metric configs", { as: "permissive", for: "delete", to: ["public"] }),
]);

export const krMetricValues = pgTable("kr_metric_values", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	krMetricConfigId: uuid("kr_metric_config_id").notNull(),
	date: date().notNull(),
	value: numeric().notNull(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [usersProfile.id],
			name: "kr_metric_values_created_by_fkey"
		}),
	foreignKey({
			columns: [table.krMetricConfigId],
			foreignColumns: [krMetricConfig.id],
			name: "kr_metric_values_kr_metric_config_id_fkey"
		}).onDelete("cascade"),
	unique("kr_metric_values_unique").on(table.krMetricConfigId, table.date),
	pgPolicy("Users can view org kr metric values", { as: "permissive", for: "select", to: ["public"], using: sql`(is_platform_admin(auth.uid()) OR (EXISTS ( SELECT 1
   FROM (kr_metric_config mc
     JOIN key_results kr ON ((kr.id = mc.key_result_id)))
  WHERE ((mc.id = kr_metric_values.kr_metric_config_id) AND (kr.organization_id = get_user_org_id(auth.uid()))))))` }),
	pgPolicy("Managers and owners can create kr metric values", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Managers and owners can update kr metric values", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Managers and owners can delete kr metric values", { as: "permissive", for: "delete", to: ["public"] }),
]);

export const initiativeKrLinks = pgTable("initiative_kr_links", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	initiativeId: uuid("initiative_id").notNull(),
	keyResultId: uuid("key_result_id").notNull(),
	weight: numeric(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.initiativeId],
			foreignColumns: [initiatives.id],
			name: "initiative_kr_links_initiative_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.keyResultId],
			foreignColumns: [keyResults.id],
			name: "initiative_kr_links_key_result_id_fkey"
		}).onDelete("cascade"),
	unique("initiative_kr_links_initiative_id_key_result_id_key").on(table.initiativeId, table.keyResultId),
	pgPolicy("Users can view org initiative_kr_links", { as: "permissive", for: "select", to: ["public"], using: sql`(is_platform_admin(auth.uid()) OR (EXISTS ( SELECT 1
   FROM initiatives i
  WHERE ((i.id = initiative_kr_links.initiative_id) AND (i.organization_id = get_user_org_id(auth.uid()))))))` }),
	pgPolicy("Managers and owners can create initiative_kr_links", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Managers and owners can update initiative_kr_links", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Managers and owners can delete initiative_kr_links", { as: "permissive", for: "delete", to: ["public"] }),
]);

export const initiatives = pgTable("initiatives", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizationId: uuid("organization_id").notNull(),
	title: text().notNull(),
	description: text(),
	ownerId: uuid("owner_id"),
	status: initiativeStatus().default('not_started').notNull(),
	startDate: date("start_date"),
	endDate: date("end_date"),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	color: text(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [usersProfile.id],
			name: "initiatives_created_by_fkey"
		}),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "initiatives_organization_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [usersProfile.id],
			name: "initiatives_owner_id_fkey"
		}),
	pgPolicy("Users can view org initiatives", { as: "permissive", for: "select", to: ["public"], using: sql`(is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid())))` }),
	pgPolicy("Admins and managers can create initiatives", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Admins and managers can update any initiatives", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Initiative owners can update their initiatives", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Admins and managers can delete initiatives", { as: "permissive", for: "delete", to: ["public"] }),
]);

export const krReviewCadence = pgTable("kr_review_cadence", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	keyResultId: uuid("key_result_id").notNull(),
	frequency: reviewFrequency().notNull(),
	dayOfWeek: integer("day_of_week"),
	time: text().default('09:00').notNull(),
	nextReviewDate: date("next_review_date").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.keyResultId],
			foreignColumns: [keyResults.id],
			name: "kr_review_cadence_key_result_id_fkey"
		}).onDelete("cascade"),
	unique("unique_kr_cadence").on(table.keyResultId),
	pgPolicy("Users can view org kr_review_cadence", { as: "permissive", for: "select", to: ["public"], using: sql`(is_platform_admin(auth.uid()) OR (EXISTS ( SELECT 1
   FROM key_results kr
  WHERE ((kr.id = kr_review_cadence.key_result_id) AND (kr.organization_id = get_user_org_id(auth.uid()))))))` }),
	pgPolicy("Managers and KR owners can insert kr_review_cadence", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Managers and KR owners can update kr_review_cadence", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Managers and KR owners can delete kr_review_cadence", { as: "permissive", for: "delete", to: ["public"] }),
	check("kr_review_cadence_day_of_week_check", sql`(day_of_week IS NULL) OR ((day_of_week >= 0) AND (day_of_week <= 6))`),
]);

export const krReviewSessions = pgTable("kr_review_sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	keyResultId: uuid("key_result_id").notNull(),
	reviewDate: date("review_date").notNull(),
	status: reviewSessionStatus().default('scheduled').notNull(),
	notes: text(),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.keyResultId],
			foreignColumns: [keyResults.id],
			name: "kr_review_sessions_key_result_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can view org kr_review_sessions", { as: "permissive", for: "select", to: ["public"], using: sql`(is_platform_admin(auth.uid()) OR (EXISTS ( SELECT 1
   FROM key_results kr
  WHERE ((kr.id = kr_review_sessions.key_result_id) AND (kr.organization_id = get_user_org_id(auth.uid()))))))` }),
	pgPolicy("Managers and KR owners can insert kr_review_sessions", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Managers and KR owners can update kr_review_sessions", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Managers and KR owners can delete kr_review_sessions", { as: "permissive", for: "delete", to: ["public"] }),
]);

export const krReviewParticipants = pgTable("kr_review_participants", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	reviewSessionId: uuid("review_session_id").notNull(),
	userId: uuid("user_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.reviewSessionId],
			foreignColumns: [krReviewSessions.id],
			name: "kr_review_participants_review_session_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersProfile.id],
			name: "kr_review_participants_user_id_fkey"
		}),
	unique("unique_session_participant").on(table.reviewSessionId, table.userId),
	pgPolicy("Users can view org kr_review_participants", { as: "permissive", for: "select", to: ["public"], using: sql`(is_platform_admin(auth.uid()) OR (EXISTS ( SELECT 1
   FROM (kr_review_sessions rs
     JOIN key_results kr ON ((kr.id = rs.key_result_id)))
  WHERE ((rs.id = kr_review_participants.review_session_id) AND (kr.organization_id = get_user_org_id(auth.uid()))))))` }),
	pgPolicy("Managers and session owners can insert kr_review_participants", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Managers and session owners can delete kr_review_participants", { as: "permissive", for: "delete", to: ["public"] }),
]);

export const organizationMemberships = pgTable("organization_memberships", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	organizationId: uuid("organization_id").notNull(),
	isActive: boolean("is_active").default(false).notNull(),
	joinedAt: timestamp("joined_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "organization_memberships_organization_id_fkey"
		}).onDelete("cascade"),
	// Hand-fixed after drizzle-kit pull: FK to auth.users removed — the
	// generator references a table outside the introspected public schema.
	// The constraint still exists in the database.
	unique("organization_memberships_user_id_organization_id_key").on(table.userId, table.organizationId),
	pgPolicy("Users can view their own memberships", { as: "permissive", for: "select", to: ["authenticated"], using: sql`((user_id = auth.uid()) OR is_platform_admin(auth.uid()))` }),
	pgPolicy("Platform admins can manage memberships", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const updates = pgTable("updates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizationId: uuid("organization_id").notNull(),
	entityType: entityType("entity_type").notNull(),
	entityId: uuid("entity_id").notNull(),
	userId: uuid("user_id").notNull(),
	updateKind: updateKind("update_kind").notNull(),
	content: text().notNull(),
	pinned: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_updates_entity").using("btree", table.entityType.asc().nullsLast().op("enum_ops"), table.entityId.asc().nullsLast().op("uuid_ops")),
	index("idx_updates_organization").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops")),
	index("idx_updates_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "updates_organization_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersProfile.id],
			name: "updates_user_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can view org updates", { as: "permissive", for: "select", to: ["public"], using: sql`(is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid())))` }),
	pgPolicy("Users can create updates", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Authorized users can update pinned status", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Authors and managers can delete updates", { as: "permissive", for: "delete", to: ["public"] }),
]);

export const updateMentions = pgTable("update_mentions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	updateId: uuid("update_id").notNull(),
	mentionedUserId: uuid("mentioned_user_id").notNull(),
}, (table) => [
	index("idx_update_mentions_update").using("btree", table.updateId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.mentionedUserId],
			foreignColumns: [usersProfile.id],
			name: "update_mentions_mentioned_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.updateId],
			foreignColumns: [updates.id],
			name: "update_mentions_update_id_fkey"
		}).onDelete("cascade"),
	unique("update_mentions_update_id_mentioned_user_id_key").on(table.updateId, table.mentionedUserId),
	pgPolicy("Users can view org update mentions", { as: "permissive", for: "select", to: ["public"], using: sql`(is_platform_admin(auth.uid()) OR (get_org_id_from_update(update_id) = get_user_org_id(auth.uid())))` }),
	pgPolicy("Update authors can create mentions", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Update authors can delete mentions", { as: "permissive", for: "delete", to: ["public"] }),
]);

export const updateReactions = pgTable("update_reactions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	updateId: uuid("update_id").notNull(),
	userId: uuid("user_id").notNull(),
	reactionType: text("reaction_type").notNull(),
}, (table) => [
	index("idx_update_reactions_update").using("btree", table.updateId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.updateId],
			foreignColumns: [updates.id],
			name: "update_reactions_update_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersProfile.id],
			name: "update_reactions_user_id_fkey"
		}).onDelete("cascade"),
	unique("update_reactions_update_id_user_id_reaction_type_key").on(table.updateId, table.userId, table.reactionType),
	pgPolicy("Users can view org update reactions", { as: "permissive", for: "select", to: ["public"], using: sql`(is_platform_admin(auth.uid()) OR (get_org_id_from_update(update_id) = get_user_org_id(auth.uid())))` }),
	pgPolicy("Org members can add reactions", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Users can remove their own reactions", { as: "permissive", for: "delete", to: ["public"] }),
]);

export const notifications = pgTable("notifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	type: notificationType().notNull(),
	entityType: entityType("entity_type"),
	entityId: uuid("entity_id"),
	message: text().notNull(),
	read: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_notifications_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_notifications_read").using("btree", table.userId.asc().nullsLast().op("bool_ops"), table.read.asc().nullsLast().op("bool_ops")),
	index("idx_notifications_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersProfile.id],
			name: "notifications_user_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can view their own notifications", { as: "permissive", for: "select", to: ["public"], using: sql`(is_platform_admin(auth.uid()) OR ((auth.uid() IS NOT NULL) AND (user_id = auth.uid())))` }),
	pgPolicy("Users can update their own notifications", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Users can delete their own notifications", { as: "permissive", for: "delete", to: ["public"] }),
]);

export const tasks = pgTable("tasks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	initiativeId: uuid("initiative_id").notNull(),
	title: text().notNull(),
	description: text(),
	assigneeUserId: uuid("assignee_user_id"),
	assigneeTeamId: uuid("assignee_team_id"),
	status: taskStatus().default('todo').notNull(),
	startDate: date("start_date"),
	dueDate: date("due_date"),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	color: text(),
	parentTaskId: uuid("parent_task_id"),
	recurrenceRule: jsonb("recurrence_rule"),
}, (table) => [
	foreignKey({
			columns: [table.assigneeTeamId],
			foreignColumns: [teams.id],
			name: "tasks_assignee_team_id_fkey"
		}),
	foreignKey({
			columns: [table.assigneeUserId],
			foreignColumns: [usersProfile.id],
			name: "tasks_assignee_user_id_fkey"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [usersProfile.id],
			name: "tasks_created_by_fkey"
		}),
	foreignKey({
			columns: [table.initiativeId],
			foreignColumns: [initiatives.id],
			name: "tasks_initiative_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.parentTaskId],
			foreignColumns: [table.id],
			name: "tasks_parent_task_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can view org tasks", { as: "permissive", for: "select", to: ["public"], using: sql`(is_platform_admin(auth.uid()) OR (EXISTS ( SELECT 1
   FROM initiatives i
  WHERE ((i.id = tasks.initiative_id) AND (i.organization_id = get_user_org_id(auth.uid()))))))` }),
	pgPolicy("Admins managers and initiative owners can create tasks", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Authorized users can update tasks", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Admins managers and initiative owners can delete tasks", { as: "permissive", for: "delete", to: ["public"] }),
	check("check_dates", sql`(start_date IS NULL) OR (due_date IS NULL) OR (due_date >= start_date)`),
	check("check_single_assignee", sql`NOT ((assignee_user_id IS NOT NULL) AND (assignee_team_id IS NOT NULL))`),
]);

export const fileAttachments = pgTable("file_attachments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizationId: uuid("organization_id").notNull(),
	entityType: entityType("entity_type").notNull(),
	entityId: uuid("entity_id").notNull(),
	fileName: text("file_name").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	fileSize: bigint("file_size", { mode: "number" }).default(0).notNull(),
	fileType: text("file_type"),
	storagePath: text("storage_path").notNull(),
	uploadedBy: uuid("uploaded_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "file_attachments_organization_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.uploadedBy],
			foreignColumns: [usersProfile.id],
			name: "file_attachments_uploaded_by_fkey"
		}).onDelete("set null"),
	pgPolicy("Users can view org file attachments", { as: "permissive", for: "select", to: ["public"], using: sql`(is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid())))` }),
	pgPolicy("Org users can create file attachments", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Authorized users can delete file attachments", { as: "permissive", for: "delete", to: ["public"] }),
]);

export const automations = pgTable("automations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizationId: uuid("organization_id").notNull(),
	name: text().notNull(),
	triggerType: automationTrigger("trigger_type").notNull(),
	triggerConfig: jsonb("trigger_config").default({}).notNull(),
	actionType: automationAction("action_type").notNull(),
	actionConfig: jsonb("action_config").default({}).notNull(),
	enabled: boolean().default(true).notNull(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [usersProfile.id],
			name: "automations_created_by_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "automations_organization_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can view org automations", { as: "permissive", for: "select", to: ["public"], using: sql`(is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid())))` }),
	pgPolicy("Admins and managers can create automations", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Admins and managers can update automations", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Admins and managers can delete automations", { as: "permissive", for: "delete", to: ["public"] }),
]);

export const platformAdmins = pgTable("platform_admins", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("platform_admins_email_unique").on(table.email),
	pgPolicy("Platform admins can remove platform_admins", { as: "permissive", for: "delete", to: ["public"], using: sql`is_platform_admin(auth.uid())` }),
	pgPolicy("Platform admins can view platform_admins", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("Platform admins can add platform_admins", { as: "permissive", for: "insert", to: ["public"] }),
	check("platform_admins_email_lowercase", sql`email = lower(email)`),
]);

export const organizations = pgTable("organizations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().default('New Organization').notNull(),
	logoUrl: text("logo_url"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	pgPolicy("Users can view their own organization", { as: "permissive", for: "select", to: ["public"], using: sql`(is_platform_admin(auth.uid()) OR (id = get_user_org_id(auth.uid())))` }),
	pgPolicy("Admins can update their organization", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Platform admins can delete organizations", { as: "permissive", for: "delete", to: ["public"] }),
]);

export const organizationDomains = pgTable("organization_domains", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizationId: uuid("organization_id").notNull(),
	domain: text().notNull(),
	verified: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_org_domains_org_id").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "organization_domains_organization_id_fkey"
		}).onDelete("cascade"),
	unique("domain_unique").on(table.domain),
	pgPolicy("Users can view their organization domains", { as: "permissive", for: "select", to: ["public"], using: sql`(is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid())))` }),
	pgPolicy("Admins can insert domains for their organization", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Admins can update domains for their organization", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Admins can delete domains for their organization", { as: "permissive", for: "delete", to: ["public"] }),
	check("domain_lowercase", sql`domain = lower(TRIM(BOTH FROM domain))`),
]);

export const usersProfile = pgTable("users_profile", {
	id: uuid().primaryKey().notNull(),
	organizationId: uuid("organization_id"),
	email: text().notNull(),
	// NOTE: hand-fixed after drizzle-kit pull — the generator mangles
	// empty-string defaults into `default(')`. Re-apply if you re-pull.
	name: text().default('').notNull(),
	avatarUrl: text("avatar_url"),
	status: userStatus().default('pending').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_users_profile_org_id").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops")),
	index("idx_users_profile_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	// Hand-fixed after drizzle-kit pull: FK to auth.users removed (see note
	// on organization_memberships).
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "users_profile_organization_id_fkey"
		}).onDelete("set null"),
	unique("email_unique").on(table.email),
	pgPolicy("Platform admins can delete users", { as: "permissive", for: "delete", to: ["public"], using: sql`is_platform_admin(auth.uid())` }),
	pgPolicy("Users can view their own profile", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("Admins and managers can view org users", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("Users can update their own profile", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Admins can update org users", { as: "permissive", for: "update", to: ["public"] }),
	check("email_lowercase", sql`email = lower(TRIM(BOTH FROM email))`),
]);

export const genericDomains = pgTable("generic_domains", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	domain: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("generic_domains_domain_key").on(table.domain),
	pgPolicy("Authenticated users can view generic_domains", { as: "permissive", for: "select", to: ["authenticated"], using: sql`true` }),
	pgPolicy("Platform admins can manage generic_domains", { as: "permissive", for: "all", to: ["public"] }),
]);

export const userInvitations = pgTable("user_invitations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizationId: uuid("organization_id").notNull(),
	email: text().notNull(),
	role: appRole().notNull(),
	token: text(),
	status: invitationStatus().default('pending').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	tokenHash: text("token_hash"),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).default(sql`(now() + '7 days'::interval)`),
}, (table) => [
	index("idx_user_invitations_email").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("idx_user_invitations_organization_id").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops")),
	index("idx_user_invitations_token").using("btree", table.token.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "user_invitations_organization_id_fkey"
		}).onDelete("cascade"),
	unique("user_invitations_token_key").on(table.token),
	pgPolicy("No direct select access to user_invitations", { as: "permissive", for: "select", to: ["public"], using: sql`false` }),
	pgPolicy("Admins and managers can create invitations", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Admins and managers can update invitations", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Platform admins can delete invitations", { as: "permissive", for: "delete", to: ["public"] }),
]);

export const taskDependencies = pgTable("task_dependencies", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	taskId: uuid("task_id").notNull(),
	dependsOnTaskId: uuid("depends_on_task_id").notNull(),
	dependencyType: text("dependency_type").default('blocks').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.dependsOnTaskId],
			foreignColumns: [tasks.id],
			name: "task_dependencies_depends_on_task_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.taskId],
			foreignColumns: [tasks.id],
			name: "task_dependencies_task_id_fkey"
		}).onDelete("cascade"),
	unique("task_dependencies_task_id_depends_on_task_id_key").on(table.taskId, table.dependsOnTaskId),
	pgPolicy("Users can view org task dependencies", { as: "permissive", for: "select", to: ["authenticated"], using: sql`(is_platform_admin(auth.uid()) OR (EXISTS ( SELECT 1
   FROM (tasks t
     JOIN initiatives i ON ((i.id = t.initiative_id)))
  WHERE ((t.id = task_dependencies.task_id) AND (i.organization_id = get_user_org_id(auth.uid()))))))` }),
	pgPolicy("Authorized users can create task dependencies", { as: "permissive", for: "insert", to: ["authenticated"] }),
	pgPolicy("Authorized users can delete task dependencies", { as: "permissive", for: "delete", to: ["authenticated"] }),
	check("task_dependencies_dependency_type_check", sql`dependency_type = ANY (ARRAY['blocks'::text, 'waiting_on'::text])`),
]);

export const userRoles = pgTable("user_roles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	role: appRole().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	organizationId: uuid("organization_id"),
}, (table) => [
	index("idx_user_roles_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "user_roles_organization_id_fkey"
		}),
	// Hand-fixed after drizzle-kit pull: FK to auth.users removed (see note
	// on organization_memberships).
	unique("user_roles_user_id_role_org_key").on(table.userId, table.role, table.organizationId),
	pgPolicy("Users can view their own roles", { as: "permissive", for: "select", to: ["public"], using: sql`(is_platform_admin(auth.uid()) OR (user_id = auth.uid()))` }),
	pgPolicy("Admins and managers can view org user roles", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("Admins can manage org user roles", { as: "permissive", for: "all", to: ["public"] }),
]);

export const initiativeShareLinks = pgTable("initiative_share_links", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	initiativeId: uuid("initiative_id").notNull(),
	// Hand-fixed after drizzle-kit pull: bare gen_random_uuid() emitted.
	token: text().default(sql`gen_random_uuid()`).notNull(),
	createdBy: uuid("created_by"),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [usersProfile.id],
			name: "initiative_share_links_created_by_fkey"
		}),
	foreignKey({
			columns: [table.initiativeId],
			foreignColumns: [initiatives.id],
			name: "initiative_share_links_initiative_id_fkey"
		}).onDelete("cascade"),
	unique("initiative_share_links_token_key").on(table.token),
	pgPolicy("Initiative managers can manage share links", { as: "permissive", for: "all", to: ["authenticated"], using: sql`can_manage_initiative(auth.uid(), initiative_id)`, withCheck: sql`can_manage_initiative(auth.uid(), initiative_id)`  }),
	pgPolicy("Platform admins can manage share links", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const teams = pgTable("teams", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizationId: uuid("organization_id").notNull(),
	name: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_teams_organization_id").using("btree", table.organizationId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "teams_organization_id_fkey"
		}).onDelete("cascade"),
	unique("teams_org_name_unique").on(table.organizationId, table.name),
	pgPolicy("Users can view teams in their organization", { as: "permissive", for: "select", to: ["public"], using: sql`(is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid())))` }),
	pgPolicy("Admins and managers can create teams", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Admins and managers can update teams", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Admins and managers can delete teams", { as: "permissive", for: "delete", to: ["public"] }),
]);

export const teamMembers = pgTable("team_members", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	teamId: uuid("team_id").notNull(),
	userId: uuid("user_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_team_members_team_id").using("btree", table.teamId.asc().nullsLast().op("uuid_ops")),
	index("idx_team_members_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.teamId],
			foreignColumns: [teams.id],
			name: "team_members_team_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersProfile.id],
			name: "team_members_user_id_fkey"
		}).onDelete("cascade"),
	unique("team_members_unique").on(table.teamId, table.userId),
	pgPolicy("Users can view team members in their organization", { as: "permissive", for: "select", to: ["public"], using: sql`(is_platform_admin(auth.uid()) OR (EXISTS ( SELECT 1
   FROM teams t
  WHERE ((t.id = team_members.team_id) AND (t.organization_id = get_user_org_id(auth.uid()))))))` }),
	pgPolicy("Admins and managers can add team members", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Admins and managers can remove team members", { as: "permissive", for: "delete", to: ["public"] }),
]);

export const objectives = pgTable("objectives", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizationId: uuid("organization_id").notNull(),
	title: text().notNull(),
	description: text(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [usersProfile.id],
			name: "objectives_created_by_fkey"
		}),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "objectives_organization_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Users can view org objectives", { as: "permissive", for: "select", to: ["public"], using: sql`(is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid())))` }),
	pgPolicy("Admins and managers can create objectives", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Admins and managers can update objectives", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Admins and managers can delete objectives", { as: "permissive", for: "delete", to: ["public"] }),
]);

export const keyResults = pgTable("key_results", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizationId: uuid("organization_id").notNull(),
	objectiveId: uuid("objective_id"),
	parentKrId: uuid("parent_kr_id"),
	title: text().notNull(),
	description: text(),
	ownerId: uuid("owner_id"),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [usersProfile.id],
			name: "key_results_created_by_fkey"
		}),
	foreignKey({
			columns: [table.objectiveId],
			foreignColumns: [objectives.id],
			name: "key_results_objective_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "key_results_organization_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [usersProfile.id],
			name: "key_results_owner_id_fkey"
		}),
	foreignKey({
			columns: [table.parentKrId],
			foreignColumns: [table.id],
			name: "key_results_parent_kr_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("Admins managers can update any KRs", { as: "permissive", for: "update", to: ["public"], using: sql`(is_platform_admin(auth.uid()) OR ((organization_id = get_user_org_id(auth.uid())) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))))`, withCheck: sql`(is_platform_admin(auth.uid()) OR ((organization_id = get_user_org_id(auth.uid())) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))))`  }),
	pgPolicy("Contributors can update owned KRs", { as: "permissive", for: "update", to: ["public"] }),
	pgPolicy("Users can view org key results", { as: "permissive", for: "select", to: ["public"] }),
	pgPolicy("Admins and managers can create key results", { as: "permissive", for: "insert", to: ["public"] }),
	pgPolicy("Admins and managers can delete key results", { as: "permissive", for: "delete", to: ["public"] }),
	check("kr_hierarchy_check", sql`((objective_id IS NOT NULL) AND (parent_kr_id IS NULL)) OR ((objective_id IS NULL) AND (parent_kr_id IS NOT NULL))`),
]);

export const customFieldDefinitions = pgTable("custom_field_definitions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizationId: uuid("organization_id").notNull(),
	name: text().notNull(),
	fieldType: customFieldType("field_type").notNull(),
	options: jsonb().default([]),
	entityType: entityType("entity_type").default('task').notNull(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [usersProfile.id],
			name: "custom_field_definitions_created_by_fkey"
		}),
	foreignKey({
			columns: [table.organizationId],
			foreignColumns: [organizations.id],
			name: "custom_field_definitions_organization_id_fkey"
		}).onDelete("cascade"),
	unique("custom_field_definitions_organization_id_name_entity_type_key").on(table.organizationId, table.name, table.entityType),
	pgPolicy("Users can view org custom field definitions", { as: "permissive", for: "select", to: ["authenticated"], using: sql`(is_platform_admin(auth.uid()) OR (organization_id = get_user_org_id(auth.uid())))` }),
	pgPolicy("Admins and managers can manage custom field definitions", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const customFieldValues = pgTable("custom_field_values", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	fieldDefinitionId: uuid("field_definition_id").notNull(),
	entityType: entityType("entity_type").notNull(),
	entityId: uuid("entity_id").notNull(),
	value: jsonb().default("").notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.fieldDefinitionId],
			foreignColumns: [customFieldDefinitions.id],
			name: "custom_field_values_field_definition_id_fkey"
		}).onDelete("cascade"),
	unique("custom_field_values_field_definition_id_entity_id_key").on(table.fieldDefinitionId, table.entityId),
	pgPolicy("Users can view org custom field values", { as: "permissive", for: "select", to: ["authenticated"], using: sql`(is_platform_admin(auth.uid()) OR (EXISTS ( SELECT 1
   FROM custom_field_definitions cfd
  WHERE ((cfd.id = custom_field_values.field_definition_id) AND (cfd.organization_id = get_user_org_id(auth.uid()))))))` }),
	pgPolicy("Authorized users can manage custom field values", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const taskWatchers = pgTable("task_watchers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	taskId: uuid("task_id").notNull(),
	userId: uuid("user_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.taskId],
			foreignColumns: [tasks.id],
			name: "task_watchers_task_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [usersProfile.id],
			name: "task_watchers_user_id_fkey"
		}).onDelete("cascade"),
	unique("task_watchers_task_id_user_id_key").on(table.taskId, table.userId),
	pgPolicy("Users can view org task watchers", { as: "permissive", for: "select", to: ["authenticated"], using: sql`(is_platform_admin(auth.uid()) OR (EXISTS ( SELECT 1
   FROM (tasks t
     JOIN initiatives i ON ((i.id = t.initiative_id)))
  WHERE ((t.id = task_watchers.task_id) AND (i.organization_id = get_user_org_id(auth.uid()))))))` }),
	pgPolicy("Org users can watch tasks", { as: "permissive", for: "insert", to: ["authenticated"] }),
	pgPolicy("Users can unwatch tasks", { as: "permissive", for: "delete", to: ["authenticated"] }),
	pgPolicy("Managers can manage watchers", { as: "permissive", for: "all", to: ["authenticated"] }),
]);

export const initiativeShareViewers = pgTable("initiative_share_viewers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	shareLinkId: uuid("share_link_id").notNull(),
	email: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.shareLinkId],
			foreignColumns: [initiativeShareLinks.id],
			name: "initiative_share_viewers_share_link_id_fkey"
		}).onDelete("cascade"),
	unique("initiative_share_viewers_share_link_id_email_key").on(table.shareLinkId, table.email),
	pgPolicy("Share link managers can manage viewers", { as: "permissive", for: "all", to: ["authenticated"], using: sql`(EXISTS ( SELECT 1
   FROM initiative_share_links sl
  WHERE ((sl.id = initiative_share_viewers.share_link_id) AND can_manage_initiative(auth.uid(), sl.initiative_id))))`, withCheck: sql`(EXISTS ( SELECT 1
   FROM initiative_share_links sl
  WHERE ((sl.id = initiative_share_viewers.share_link_id) AND can_manage_initiative(auth.uid(), sl.initiative_id))))`  }),
	pgPolicy("Platform admins can manage viewers", { as: "permissive", for: "all", to: ["authenticated"] }),
]);
export const userInvitationsSafe = pgView("user_invitations_safe", {	id: uuid(),
	organizationId: uuid("organization_id"),
	email: text(),
	role: appRole(),
	status: invitationStatus(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }),
}).as(sql`SELECT id, organization_id, email, role, status, expires_at, created_at FROM user_invitations ui WHERE organization_id = get_user_org_id(auth.uid()) AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR is_platform_admin(auth.uid()))`);