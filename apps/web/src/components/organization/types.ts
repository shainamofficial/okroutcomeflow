export interface Organization {
  id: string;
  name: string;
  logo_url: string | null;
  created_at: string;
}

export interface OrganizationDomain {
  id: string;
  domain: string;
  verified: boolean;
  created_at: string;
  organization_id: string;
}
