import { useState } from "react";
import { Plus, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useCustomFields, CustomFieldType } from "@/hooks/useCustomFields";
import { Badge } from "@/components/ui/badge";

interface CustomFieldManagerProps {
  entityType: "kr" | "initiative" | "task";
}

export function CustomFieldManager({ entityType }: CustomFieldManagerProps) {
  const { definitions, createDefinition, deleteDefinition } = useCustomFields(entityType);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [fieldType, setFieldType] = useState<CustomFieldType>("text");
  const [options, setOptions] = useState<string[]>([]);
  const [optionInput, setOptionInput] = useState("");

  const handleCreate = () => {
    if (!name.trim()) return;
    createDefinition.mutate(
      { name: name.trim(), field_type: fieldType, options: (fieldType === "select" || fieldType === "multi_select") ? options : undefined },
      { onSuccess: () => { setOpen(false); setName(""); setFieldType("text"); setOptions([]); } }
    );
  };

  const addOption = () => {
    if (optionInput.trim() && !options.includes(optionInput.trim())) {
      setOptions([...options, optionInput.trim()]);
      setOptionInput("");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Custom Fields</span>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 text-xs gap-1">
              <Plus className="h-3 w-3" /> Add Field
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Add Custom Field</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label className="text-xs">Field Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priority" className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select value={fieldType} onValueChange={(v) => setFieldType(v as CustomFieldType)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="select">Dropdown</SelectItem>
                    <SelectItem value="multi_select">Multi-Select</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="checkbox">Checkbox</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(fieldType === "select" || fieldType === "multi_select") && (
                <div className="space-y-1">
                  <Label className="text-xs">Options</Label>
                  <div className="flex gap-1.5">
                    <Input
                      value={optionInput}
                      onChange={(e) => setOptionInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOption())}
                      placeholder="Add option"
                      className="h-8 text-sm"
                    />
                    <Button size="sm" className="h-8" onClick={addOption}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {options.map((o) => (
                      <Badge key={o} variant="secondary" className="gap-1 text-xs">
                        {o}
                        <X className="h-2.5 w-2.5 cursor-pointer" onClick={() => setOptions(options.filter((x) => x !== o))} />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button size="sm" onClick={handleCreate} disabled={!name.trim()}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {definitions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {definitions.map((d) => (
            <Badge key={d.id} variant="outline" className="text-xs gap-1">
              {d.name}
              <button onClick={() => deleteDefinition.mutate(d.id)} className="hover:text-destructive">
                <Trash2 className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
