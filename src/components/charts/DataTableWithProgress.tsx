import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ProgressBar } from './ProgressBar';
import { getChartColor } from '@/lib/chartColors';

interface DataTableWithProgressProps {
  columns: string[];
  rows: (string | number)[][];
  colors?: string[];
}

export function DataTableWithProgress({ columns, rows, colors }: DataTableWithProgressProps) {
  // Find the percentage column (usually named "Percent" or "%")
  const percentColIndex = columns.findIndex(col => 
    col.toLowerCase().includes('percent') || col === '%'
  );

  return (
    <ScrollArea className="max-h-[300px]">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col, index) => (
              <TableHead 
                key={index} 
                className={`font-semibold ${index === 0 ? 'w-[40%]' : ''}`}
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
                const isPercentCell = cellIndex === percentColIndex;
                const color = colors?.[rowIndex] ?? getChartColor(rowIndex);
                
                // Extract numeric percentage from string like "52.0%"
                let percentValue = 0;
                if (isPercentCell) {
                  if (typeof cell === 'string') {
                    percentValue = parseFloat(cell.replace('%', '')) || 0;
                  } else if (typeof cell === 'number') {
                    percentValue = cell;
                  }
                }

                return (
                  <TableCell key={cellIndex}>
                    {isPercentCell ? (
                      <ProgressBar value={percentValue} color={color} />
                    ) : (
                      <span>
                        {cell === null || cell === undefined
                          ? '-'
                          : typeof cell === 'number'
                            ? cell.toLocaleString(undefined, { maximumFractionDigits: 2 })
                            : String(cell)}
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
  );
}
