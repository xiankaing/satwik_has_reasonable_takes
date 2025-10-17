'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface PnLRecord {
  id: string
  year: number
  attributedRevenue: number
  totalCost: number
  notes?: string
}

interface PnLTableProps {
  records: PnLRecord[]
  showNotes?: boolean
}

export function PnLTable({ records, showNotes = false }: PnLTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const calculateProfit = (revenue: number, cost: number) => revenue - cost
  const calculateROI = (revenue: number, cost: number) => 
    cost > 0 ? ((revenue - cost) / cost) * 100 : 0

  return (
    <div className="bg-white rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Year</TableHead>
            <TableHead className="text-right">Attributed Revenue</TableHead>
            <TableHead className="text-right">Total Cost</TableHead>
            <TableHead className="text-right">Profit</TableHead>
            <TableHead className="text-right">ROI</TableHead>
            {showNotes && <TableHead>Notes</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => {
            const profit = calculateProfit(record.attributedRevenue, record.totalCost)
            const roi = calculateROI(record.attributedRevenue, record.totalCost)
            
            return (
              <TableRow key={record.id}>
                <TableCell className="font-medium">{record.year}</TableCell>
                <TableCell className="text-right text-green-600">
                  {formatCurrency(record.attributedRevenue)}
                </TableCell>
                <TableCell className="text-right text-red-600">
                  {formatCurrency(record.totalCost)}
                </TableCell>
                <TableCell className={`text-right font-medium ${
                  profit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(profit)}
                </TableCell>
                <TableCell className={`text-right font-medium ${
                  roi >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {roi.toFixed(1)}%
                </TableCell>
                {showNotes && (
                  <TableCell className="text-sm text-gray-500">
                    {record.notes || '-'}
                  </TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
