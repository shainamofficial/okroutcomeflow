import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl gradient-primary mb-3">
            <span className="text-lg font-bold text-primary-foreground">O</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-display">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="bg-card border border-border/60 rounded-xl p-6 shadow-card">
          {children}
        </div>
        <p className="text-center text-xs text-muted-foreground">
          OutcomeFlow
        </p>
      </div>
    </div>
  );
}
