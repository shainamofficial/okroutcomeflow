import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CustomFieldDefinition } from "@/hooks/useCustomFields";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface CustomFieldCellProps {
  definition: CustomFieldDefinition;
  value: unknown;
  onValueChange: (value: unknown) => void;
}

export function CustomFieldCell({ definition, value, onValueChange }: CustomFieldCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const startEdit = (initial: string) => { setDraft(initial); setEditing(true); };

  if (definition.field_type === "text") {
    if (editing) {
      return (
        <Input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => { onValueChange(draft); setEditing(false); }}
          onKeyDown={(e) => { if (e.key === "Enter") { onValueChange(draft); setEditing(false); } }}
          className="h-7 text-xs"
        />
      );
    }
    return (
      <span onClick={() => startEdit(String(value || ""))} className="cursor-pointer hover:bg-accent/50 rounded px-1 py-0.5 text-xs">
        {String(value || "—")}
      </span>
    );
  }

  if (definition.field_type === "number") {
    if (editing) {
      return (
        <Input
          autoFocus type="number" value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => { onValueChange(draft ? Number(draft) : null); setEditing(false); }}
          onKeyDown={(e) => { if (e.key === "Enter") { onValueChange(draft ? Number(draft) : null); setEditing(false); } }}
          className="h-7 text-xs w-20"
        />
      );
    }
    return (
      <span onClick={() => startEdit(String(value ?? ""))} className="cursor-pointer hover:bg-accent/50 rounded px-1 py-0.5 text-xs">
        {value != null ? String(value) : "—"}
      </span>
    );
  }

  if (definition.field_type === "select") {
    return (
      <Select value={String(value || "")} onValueChange={(v) => onValueChange(v)}>
        <SelectTrigger className="h-7 text-xs border-none bg-transparent hover:bg-accent/50 focus:ring-0 w-auto min-w-[80px]">
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent>
          {definition.options.map((opt) => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (definition.field_type === "multi_select") {
    const selected = Array.isArray(value) ? value as string[] : [];
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 text-xs px-1 font-normal">
            {selected.length > 0 ? (
              <div className="flex gap-0.5 flex-wrap">
                {selected.map((s) => <Badge key={s} variant="secondary" className="text-[10px] px-1">{s}</Badge>)}
              </div>
            ) : "—"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2">
          {definition.options.map((opt) => (
            <label key={opt} className="flex items-center gap-2 py-1 text-sm cursor-pointer">
              <Checkbox
                checked={selected.includes(opt)}
                onCheckedChange={(checked) => {
                  if (checked) onValueChange([...selected, opt]);
                  else onValueChange(selected.filter((s) => s !== opt));
                }}
              />
              {opt}
            </label>
          ))}
        </PopoverContent>
      </Popover>
    );
  }

  if (definition.field_type === "checkbox") {
    return <Checkbox checked={!!value} onCheckedChange={(checked) => onValueChange(!!checked)} />;
  }

  if (definition.field_type === "date") {
    const dateVal = value ? new Date(String(value)) : undefined;
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 text-xs px-1 font-normal">
            {dateVal ? format(dateVal, "MMM d, yyyy") : "—"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar mode="single" selected={dateVal} onSelect={(d) => onValueChange(d ? format(d, "yyyy-MM-dd") : null)} />
        </PopoverContent>
      </Popover>
    );
  }

  return <span className="text-xs text-muted-foreground">—</span>;
}
