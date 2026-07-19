import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface LegalLayoutProps {
  title: string;
  updated?: string;
  children: React.ReactNode;
}

export function LegalLayout({ title, updated, children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/40 bg-card">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md gradient-primary flex items-center justify-center">
              <span className="text-[10px] font-bold text-primary-foreground">O</span>
            </div>
            <span className="font-semibold">OutcomeFlow</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 sm:py-14">
        <h1 className="text-3xl font-bold font-display tracking-tight">{title}</h1>
        {updated && <p className="mt-2 text-sm text-muted-foreground">Last updated: {updated}</p>}
        <div className="prose prose-invert prose-sm sm:prose-base max-w-none mt-8 prose-headings:font-display prose-a:text-primary">
          {children}
        </div>
      </main>

      <footer className="border-t border-border/40 py-8">
        <div className="max-w-3xl mx-auto px-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span>© OutcomeFlow</span>
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
        </div>
      </footer>
    </div>
  );
}
