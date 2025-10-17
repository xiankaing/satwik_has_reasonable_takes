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
            <TableHead className="px-3 py-2 text-xs">Year</TableHead>
            <TableHead className="text-right px-3 py-2 text-xs">Attributed Revenue</TableHead>
            <TableHead className="text-right px-3 py-2 text-xs">Total Cost</TableHead>
            <TableHead className="text-right px-3 py-2 text-xs">Profit</TableHead>
            <TableHead className="text-right px-3 py-2 text-xs">ROI</TableHead>
            {showNotes && <TableHead className="px-3 py-2 text-xs">Notes</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => {
            const profit = calculateProfit(record.attributedRevenue, record.totalCost)
            const roi = calculateROI(record.attributedRevenue, record.totalCost)
            
            return (
              <TableRow key={record.id}>
                <TableCell className="font-medium px-3 py-2 text-sm">{record.year}</TableCell>
                <TableCell className="text-right text-green-600 px-3 py-2 text-sm">
                  {formatCurrency(record.attributedRevenue)}
                </TableCell>
                <TableCell className="text-right text-red-600 px-3 py-2 text-sm">
                  {formatCurrency(record.totalCost)}
                </TableCell>
                <TableCell className={`text-right font-medium px-3 py-2 text-sm ${
                  profit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(profit)}
                </TableCell>
                <TableCell className={`text-right font-medium px-3 py-2 text-sm ${
                  roi >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {roi.toFixed(1)}%
                </TableCell>
                {showNotes && (
                  <TableCell className="text-xs text-gray-500 px-3 py-2">
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
