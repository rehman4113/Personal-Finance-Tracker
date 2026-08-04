/** Client-side CSV export utility (Sections 11 & 18). */

export interface CsvColumn {
  header: string;
  value: (row: unknown) => string | number | null | undefined;
}

function escapeCell(value: string): string {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

export function exportToCsv(filename: string, columns: CsvColumn[], rows: unknown[]): void {
  const lines = [columns.map((c) => escapeCell(c.header)).join(',')];
  for (const row of rows) {
    lines.push(columns.map((c) => escapeCell(String(c.value(row) ?? ''))).join(','));
  }
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}