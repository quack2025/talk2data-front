import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ChartTableData } from '@/types/database';

interface CrosstabTableProps {
  table: ChartTableData;
  title?: string;
}

/**
 * Renders a crosstab table with optional significance letters.
 * Cells may contain values like "45.2% AB" where AB are significance letters.
 */
export function CrosstabTable({ table, title }: CrosstabTableProps) {
  const { columns, rows } = table;

  const parseCell = (cell: string | number) => {
    if (typeof cell === 'number') {
      return { value: cell.toFixed(1) + '%', letters: '' };
    }
    const str = String(cell);
    // Match pattern like "45.2% AB" or "45.2%" or just text
    const match = str.match(/^([\d.]+%)\s*([A-Z]+)?$/);
    if (match) {
      return { value: match[1], letters: match[2] || '' };
    }
    return { value: str, letters: '' };
  };

  return (
    <div className="space-y-2">
      {title && (
        <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
      )}
      <ScrollArea className="max-h-[400px]">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col, i) => (
                <TableHead
                  key={i}
                  className={`font-semibold text-center ${i === 0 ? 'text-left w-[30%]' : ''}`}
                >
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {row.map((cell, cellIndex) => {
                  if (cellIndex === 0) {
                    // Row label
                    return (
                      <TableCell key={cellIndex} className="font-medium">
                        {cell === null || cell === undefined ? '-' : String(cell)}
                      </TableCell>
                    );
                  }

                  const { value, letters } = parseCell(cell);

                  return (
                    <TableCell key={cellIndex} className="text-center">
                      <span>{value}</span>
                      {letters && (
                        <span className="ml-1 text-xs font-bold text-blue-600 dark:text-blue-400">
                          {letters}
                        </span>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
