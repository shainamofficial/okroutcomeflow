import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pin, PinOff, Trash2 } from "lucide-react";
import { Update, useTogglePin, useDeleteUpdate, useToggleReaction } from "@/hooks/useUpdates";
import { UpdateKindBadge } from "./UpdateKindBadge";
import { ReactionPicker, ReactionButton } from "./ReactionPicker";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type EntityType = Database["public"]["Enums"]["entity_type"];

interface UpdateItemProps {
  update: Update;
  entityType: EntityType;
  entityId: string;
  canPin: boolean;
}

export function UpdateItem({ update, entityType, entityId, canPin }: UpdateItemProps) {
  const { profile, roles } = useAuth();
  const togglePin = useTogglePin();
  const deleteUpdate = useDeleteUpdate();
  const toggleReaction = useToggleReaction();

  const isAuthor = update.user_id === profile?.id;
  const isAdminOrManager = roles.includes("admin") || roles.includes("manager");
  const canDelete = isAuthor || isAdminOrManager;

  // Group reactions by type
  const reactionGroups = update.reactions.reduce((acc, reaction) => {
    if (!acc[reaction.reaction_type]) {
      acc[reaction.reaction_type] = { count: 0, userIds: [] };
    }
    acc[reaction.reaction_type].count++;
    acc[reaction.reaction_type].userIds.push(reaction.user_id);
    return acc;
  }, {} as Record<string, { count: number; userIds: string[] }>);

  const handleTogglePin = () => {
    togglePin.mutate({
      updateId: update.id,
      pinned: !update.pinned,
      entityType,
      entityId,
    });
  };

  const handleDelete = () => {
    deleteUpdate.mutate({
      updateId: update.id,
      entityType,
      entityId,
    });
  };

  const handleToggleReaction = (reactionType: string) => {
    toggleReaction.mutate({
      updateId: update.id,
      reactionType,
      entityType,
      entityId,
    });
  };

  // Render content with mentions highlighted
  const renderContent = () => {
    let content = update.content;
    const mentionedNames = update.mentions
      .map((m) => m.mentioned_user?.name)
      .filter(Boolean);

    // Simple highlighting - wrap @name in spans
    mentionedNames.forEach((name) => {
      if (name) {
        content = content.replace(
          new RegExp(`@${name}`, "g"),
          `<span class="text-primary font-medium">@${name}</span>`
        );
      }
    });

    return <p className="text-sm whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: content }} />;
  };

  return (
    <div
      className={cn(
        "p-3 border rounded-lg space-y-2",
        update.pinned && "bg-accent/30 border-accent"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={update.user?.avatar_url || undefined} />
            <AvatarFallback className="text-xs">
              {update.user?.name?.charAt(0) || update.user?.email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {update.user?.name || update.user?.email}
              </span>
              <UpdateKindBadge kind={update.update_kind} />
              {update.pinned && (
                <Pin className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(update.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>

        {(canPin || canDelete) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canPin && (
                <DropdownMenuItem onClick={handleTogglePin}>
                  {update.pinned ? (
                    <>
                      <PinOff className="h-4 w-4 mr-2" />
                      Unpin
                    </>
                  ) : (
                    <>
                      <Pin className="h-4 w-4 mr-2" />
                      Pin
                    </>
                  )}
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {renderContent()}

      <div className="flex items-center gap-1 pt-1">
        <ReactionPicker onSelect={handleToggleReaction} />
        {Object.entries(reactionGroups).map(([type, { count, userIds }]) => (
          <ReactionButton
            key={type}
            reactionType={type}
            count={count}
            isActive={userIds.includes(profile?.id || "")}
            onClick={() => handleToggleReaction(type)}
          />
        ))}
      </div>
    </div>
  );
}
