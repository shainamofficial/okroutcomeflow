import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Target,
  Flag,
  Lightbulb,
  CheckSquare,
  ArrowRight,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "okr_concept_walkthrough_seen_v1";

type Step = {
  icon: LucideIcon;
  iconBg: string;
  title: string;
  subtitle: string;
  body: string;
  example: string;
};

const steps: Step[] = [
  {
    icon: Flag,
    iconBg:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200",
    title: "Objectives",
    subtitle: "What you want to achieve",
    body: "Qualitative, inspirational, time-bound. These are the 3–5 things that matter most this quarter.",
    example: '"Become the preferred marketplace for US jewelers"',
  },
  {
    icon: Target,
    iconBg: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200",
    title: "Key Results",
    subtitle: "How you'll know you got there",
    body: "Measurable outcomes, each with a start value, target value, and deadline. Aim for 3–5 per objective. Each has one owner.",
    example: '"Grow monthly active buyers from 200 to 500"',
  },
  {
    icon: Lightbulb,
    iconBg:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200",
    title: "Initiatives",
    subtitle: "The projects that move KRs",
    body: "The things you'll actually work on. Each initiative links to the KR(s) it supports, so you can see which bets are moving the numbers.",
    example: '"Launch referral program for existing buyers"',
  },
  {
    icon: CheckSquare,
    iconBg:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200",
    title: "Tasks",
    subtitle: "The work that ships initiatives",
    body: "Concrete, assignable work items under each initiative. Due dates, owners, dependencies, and status — the day-to-day.",
    example: '"Draft referral email copy — due Friday"',
  },
];

export function ConceptWalkthrough() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && !localStorage.getItem(STORAGE_KEY)) {
        setOpen(true);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore storage errors
    }
    setOpen(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      dismiss();
    } else {
      setOpen(true);
    }
  };

  const isLast = step === steps.length - 1;
  const current = steps[step];
  const Icon = current.icon;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            Welcome to OKRoutcomeFlow
          </div>
          <DialogTitle>How this app works</DialogTitle>
          <DialogDescription>
            A 30-second tour of the four concepts that connect strategy to daily work.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 pt-2">
          <div
            className={cn(
              "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
              current.iconBg,
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <h3 className="text-base font-semibold leading-none">{current.title}</h3>
              <span className="text-xs text-muted-foreground">{current.subtitle}</span>
            </div>
            <p className="text-sm text-muted-foreground">{current.body}</p>
            <div className="rounded-md border bg-muted/30 p-3 text-sm">
              <span className="text-muted-foreground">Example: </span>
              <span className="font-medium">{current.example}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 pt-2">
          {steps.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to step ${i + 1}`}
              onClick={() => setStep(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === step ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30",
              )}
            />
          ))}
        </div>

        <DialogFooter className="sm:justify-between flex-row items-center">
          <Button variant="ghost" onClick={dismiss}>
            Skip
          </Button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
                Back
              </Button>
            )}
            {isLast ? (
              <Button onClick={dismiss}>Get started</Button>
            ) : (
              <Button onClick={() => setStep((s) => s + 1)}>
                Next
                <ArrowRight />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ConceptWalkthrough;
