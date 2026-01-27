import { useState } from "react";
import { Settings, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KeyResult } from "@/hooks/useOKRs";
import {
  useKRMetricConfig,
  useKRMetricValues,
  calculateProgress,
} from "@/hooks/useKRMetrics";
import { useAuth } from "@/contexts/AuthContext";
import { KRStatusBadge } from "./KRStatusBadge";
import { KRProgressBar } from "./KRProgressBar";
import { MetricConfigForm } from "./MetricConfigForm";
import { AddMetricValueForm } from "./AddMetricValueForm";
import { MetricValuesTable } from "./MetricValuesTable";
import { MetricChart } from "./MetricChart";

interface KRDetailPanelProps {
  keyResult: KeyResult;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KRDetailPanel({ keyResult, open, onOpenChange }: KRDetailPanelProps) {
  const [showConfigForm, setShowConfigForm] = useState(false);
  const { profile, roles } = useAuth();
  const { config, isLoading: configLoading } = useKRMetricConfig(keyResult.id);
  const { values, isLoading: valuesLoading } = useKRMetricValues(config?.id);

  const canManage =
    roles.includes("admin") ||
    roles.includes("manager") ||
    keyResult.owner_id === profile?.id;

  const progress = calculateProgress(config, values);

  const isLoading = configLoading || valuesLoading;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="pr-8">{keyResult.title}</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-6">
          {keyResult.description && (
            <p className="text-muted-foreground text-sm">{keyResult.description}</p>
          )}

          <div className="flex items-center gap-2">
            <KRStatusBadge status={progress.status} />
            {progress.currentValue !== null && config && (
              <span className="text-sm text-muted-foreground">
                Current: {progress.currentValue} {config.unit}
              </span>
            )}
          </div>

          {config && (
            <KRProgressBar
              progressPercent={progress.progressPercent}
              expectedProgress={progress.expectedProgress}
            />
          )}

          <Separator />

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : showConfigForm ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Metric Configuration</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowConfigForm(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <MetricConfigForm
                keyResultId={keyResult.id}
                config={config}
                onClose={() => setShowConfigForm(false)}
              />
            </div>
          ) : !config ? (
            <div className="text-center py-8 space-y-4">
              <p className="text-muted-foreground">No metric configured for this Key Result.</p>
              {canManage && (
                <Button onClick={() => setShowConfigForm(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Metric
                </Button>
              )}
            </div>
          ) : (
            <Tabs defaultValue="values" className="w-full">
              <div className="flex items-center justify-between mb-4">
                <TabsList>
                  <TabsTrigger value="values">Values</TabsTrigger>
                  <TabsTrigger value="chart">Chart</TabsTrigger>
                </TabsList>
                {canManage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowConfigForm(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Config
                  </Button>
                )}
              </div>

              <TabsContent value="values" className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground">Metric:</span>{" "}
                      <span className="font-medium">{config.metric_name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Direction:</span>{" "}
                      <span className="font-medium capitalize">{config.direction}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Start:</span>{" "}
                      <span className="font-medium">
                        {config.start_value} {config.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Target:</span>{" "}
                      <span className="font-medium">
                        {config.target_value} {config.unit}
                      </span>
                    </div>
                  </div>
                </div>

                {canManage && (
                  <AddMetricValueForm configId={config.id} unit={config.unit} />
                )}

                <MetricValuesTable
                  configId={config.id}
                  values={values}
                  unit={config.unit}
                  canEdit={canManage}
                />
              </TabsContent>

              <TabsContent value="chart">
                <MetricChart config={config} values={values} />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
