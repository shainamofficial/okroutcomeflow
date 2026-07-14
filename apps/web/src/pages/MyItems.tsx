import { useState } from "react";
import { Target, Lightbulb, CheckSquare, Bell, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMyKeyResults, useMyInitiatives, useMyTasks } from "@/hooks/useMyItems";
import { useNotifications } from "@/hooks/useNotifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export default function MyItems() {
  const { profile } = useAuth();
  const { data: myKRs = [], isLoading: krsLoading } = useMyKeyResults();
  const { data: myInitiatives = [], isLoading: initiativesLoading } = useMyInitiatives();
  const { data: myTasks = [], isLoading: tasksLoading } = useMyTasks();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "not_started":
        return "secondary";
      case "in_progress":
        return "default";
      case "completed":
      case "done":
        return "default";
      case "blocked":
        return "destructive";
      case "todo":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Items</h1>
        <p className="text-muted-foreground">
          Your assigned Key Results, Initiatives, Tasks, and Notifications
        </p>
      </div>

      <Tabs defaultValue="krs" className="space-y-4">
        <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-auto min-w-full sm:min-w-0">
            <TabsTrigger value="krs" className="gap-1.5 text-xs sm:text-sm sm:gap-2">
              <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Key Results</span>
              <span className="sm:hidden">KRs</span>
              {myKRs.length > 0 && (
                <Badge variant="secondary" className="ml-0.5 h-5 px-1.5 text-xs">
                  {myKRs.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="initiatives" className="gap-1.5 text-xs sm:text-sm sm:gap-2">
              <Lightbulb className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Initiatives</span>
              <span className="sm:hidden">Init.</span>
              {myInitiatives.length > 0 && (
                <Badge variant="secondary" className="ml-0.5 h-5 px-1.5 text-xs">
                  {myInitiatives.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-1.5 text-xs sm:text-sm sm:gap-2">
              <CheckSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Tasks
              {myTasks.length > 0 && (
                <Badge variant="secondary" className="ml-0.5 h-5 px-1.5 text-xs">
                  {myTasks.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5 text-xs sm:text-sm sm:gap-2">
              <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Notifications</span>
              <span className="sm:hidden">Notif.</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-0.5 h-5 px-1.5 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Key Results Tab */}
        <TabsContent value="krs">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">My Key Results</CardTitle>
            </CardHeader>
            <CardContent>
              {krsLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : myKRs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No Key Results assigned to you yet
                </p>
              ) : (
                <div className="space-y-3">
                  {myKRs.map((kr) => (
                    <div
                      key={kr.id}
                      className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                    >
                      <div>
                        <p className="text-sm font-medium">{kr.title}</p>
                        {kr.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {kr.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Initiatives Tab */}
        <TabsContent value="initiatives">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">My Initiatives</CardTitle>
            </CardHeader>
            <CardContent>
              {initiativesLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : myInitiatives.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No Initiatives owned by you yet
                </p>
              ) : (
                <div className="space-y-3">
                  {myInitiatives.map((initiative) => (
                    <div
                      key={initiative.id}
                      className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                    >
                      <div>
                        <p className="text-sm font-medium">{initiative.title}</p>
                        {initiative.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {initiative.description}
                          </p>
                        )}
                      </div>
                      <Badge variant={getStatusColor(initiative.status)}>
                        {initiative.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">My Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : myTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No Tasks assigned to you yet
                </p>
              ) : (
                <div className="space-y-3">
                  {myTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                    >
                      <div>
                        <p className="text-sm font-medium">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <Badge variant={getStatusColor(task.status)}>
                        {task.status.replace("_", " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Notifications</CardTitle>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAllAsRead.mutate()}
                >
                  Mark all as read
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notifications</p>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => {
                        if (!notification.read) {
                          markAsRead.mutate(notification.id);
                        }
                      }}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-md cursor-pointer transition-colors",
                        notification.read
                          ? "bg-muted/30 hover:bg-muted/50"
                          : "bg-primary/5 hover:bg-primary/10"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-sm",
                            !notification.read && "font-medium"
                          )}
                        >
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
