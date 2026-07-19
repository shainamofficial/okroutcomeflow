import { LegalLayout } from "@/components/legal/LegalLayout";
import { Mail } from "lucide-react";

const CONTACT_EMAIL = "hello@okroutcomeflow.com";

export default function Contact() {
  return (
    <LegalLayout title="Contact">
      <p>
        Have a question, found a bug, or want to share feedback about OutcomeFlow? We'd love to
        hear from you.
      </p>

      <div className="not-prose my-6 rounded-xl border border-border bg-card p-5 flex items-start gap-4">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Mail className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-medium text-foreground">Email us</p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-primary hover:underline break-all"
          >
            {CONTACT_EMAIL}
          </a>
          <p className="text-sm text-muted-foreground mt-1">We usually reply within a couple of business days.</p>
        </div>
      </div>

      <p>
        For privacy or data requests, see our{" "}
        <a href="/privacy">Privacy Policy</a>. For usage terms, see our{" "}
        <a href="/terms">Terms of Service</a>.
      </p>
    </LegalLayout>
  );
}
