import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';

export function DeveloperNotesSection() {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Info className="h-4 w-4" />
          Developer Notes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>
            <strong>Storage bucket:</strong> Organization logos are stored in the{' '}
            <code className="bg-muted px-1 rounded">organization-logos</code> public storage bucket.
          </li>
          <li>
            <strong>Domain validation:</strong> The{' '}
            <code className="bg-muted px-1 rounded">domain_exists_for_other_org()</code> function
            checks if a domain is already claimed by another organization globally.
          </li>
          <li>
            <strong>Admin RLS policies:</strong> Only admins can update organization details and
            manage domains via RLS policies that check{' '}
            <code className="bg-muted px-1 rounded">has_role(auth.uid(), 'admin')</code>.
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
