import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const ExcelTable = ({ data }) => {
  if (!data || data.length < 2) {
    return <p className="text-gray-500">No data to display.</p>;
  }

  const headers = data[0];

  // Remove completely empty rows
  const rows = data
    .slice(1)
    .filter(row => row.some(cell => cell && cell.toString().trim() !== ""));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {headers.map((header, index) => (
            <TableHead key={index} className="bg-gray-200">
              {header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, rowIndex) => (
          <TableRow key={rowIndex}>
            {row.map((cell, cellIndex) => {
              // Check if the cell value is a Date object and format it
              const cellContent = cell instanceof Date 
                ? cell.toLocaleDateString() 
                : cell;
              return <TableCell key={cellIndex}>{cellContent}</TableCell>;
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ExcelTable;