export interface Article {
  id: number;
  title: string;
  slug: string;
  indexed_at: string;
  metadata: {
    systems: string[];
    tags: string[];
    owner: string;
    last_reviewed: string;
    source_url?: string;
  };
  content: {
    employee: {
      summary: string;
      steps?: string;
      escalation: string;
    };
    internal: {
      diagnostics: string;
      remediation: string;
      admin_links: string;
    };
  };
}
