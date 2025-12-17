export interface ImportSummary {
  totalRows: number;
  parsedValid: number;
  inserted: number;
  duplicates: number;
  failed: number;
}

export interface ImportResult {
  summary: ImportSummary;
  inserted: Array<{ id: string; mac: string; apName: string }>;
  duplicates: Array<{
    mac: string;
    message: string;
    existing: { apName: string; locationPoint: string; ownerName: string };
  }>;
  failed: any[];
}
