import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KRMetricValue, useKRMetricValues } from "@/hooks/useKRMetrics";

interface MetricValuesTableProps {
  configId: string;
  values: KRMetricValue[];
  unit: string;
  canEdit: boolean;
}

export function MetricValuesTable({ configId, values, unit, canEdit }: MetricValuesTableProps) {
  const { deleteValue } = useKRMetricValues(configId);

  if (values.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        No metric values recorded yet.
      </div>
    );
  }

  // Sort by date descending for display
  const sortedValues = [...values].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="max-h-[200px] overflow-y-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Value ({unit})</TableHead>
            {canEdit && <TableHead className="w-10"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedValues.map((mv) => (
            <TableRow key={mv.id}>
              <TableCell>{format(new Date(mv.date), "MMM d, yyyy")}</TableCell>
              <TableCell className="text-right font-medium">{mv.value}</TableCell>
              {canEdit && (
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => deleteValue.mutate(mv.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
