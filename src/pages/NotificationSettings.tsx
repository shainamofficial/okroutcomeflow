import { useNotificationPreferences, NOTIFICATION_TYPES } from "@/hooks/useNotificationPreferences";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Bell } from "lucide-react";

export default function NotificationSettings() {
  const { getPreference, upsertPreference } = useNotificationPreferences();

  const handleToggle = (type: string, field: "in_app_enabled" | "email_enabled", value: boolean) => {
    const current = getPreference(type);
    upsertPreference.mutate({
      notification_type: type,
      in_app_enabled: field === "in_app_enabled" ? value : current.in_app_enabled,
      email_enabled: field === "email_enabled" ? value : current.email_enabled,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">Notification Settings</h1>
        <p className="text-muted-foreground mt-1">Choose how you want to be notified</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Configure which notifications you receive and how
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="grid grid-cols-[1fr_80px_80px] items-center gap-4 pb-2 text-xs font-medium text-muted-foreground">
            <span>Notification Type</span>
            <span className="text-center">In-App</span>
            <span className="text-center">Email</span>
          </div>
          <Separator />
          {NOTIFICATION_TYPES.map((nt) => {
            const pref = getPreference(nt.type);
            return (
              <div key={nt.type} className="grid grid-cols-[1fr_80px_80px] items-center gap-4 py-3">
                <div>
                  <Label className="text-sm font-medium">{nt.label}</Label>
                  <p className="text-xs text-muted-foreground">{nt.description}</p>
                </div>
                <div className="flex justify-center">
                  <Switch
                    checked={pref.in_app_enabled}
                    onCheckedChange={(v) => handleToggle(nt.type, "in_app_enabled", v)}
                  />
                </div>
                <div className="flex justify-center">
                  <Switch
                    checked={pref.email_enabled}
                    onCheckedChange={(v) => handleToggle(nt.type, "email_enabled", v)}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
