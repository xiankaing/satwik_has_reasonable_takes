'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PnLChart } from '@/components/ui/pnl-chart'
import { PnLTable } from '@/components/ui/pnl-table'

interface PnLRecord {
  id: string
  year: number
  attributedRevenue: number
  totalCost: number
  notes?: string
}

interface PnLSummary {
  totalRevenue: number
  totalCost: number
  netProfit: number
  roi: number
}

interface PnLData {
  summary: PnLSummary
  records: PnLRecord[]
}

interface PnLDetailsDialogProps {
  isOpen: boolean
  onClose: () => void
  employeeId: string | null
  employeeName: string | null
}

export function PnLDetailsDialog({ isOpen, onClose, employeeId, employeeName }: PnLDetailsDialogProps) {
  const [pnlData, setPnlData] = useState<PnLData | null>(null)
  const [pnlLoading, setPnlLoading] = useState(false)

  useEffect(() => {
    if (isOpen && employeeId) {
      setPnlLoading(true)
      fetch(`/api/employees/${employeeId}/pnl`)
        .then(res => res.json())
        .then(data => {
          setPnlData(data)
        })
        .catch(err => {
          console.error('Failed to fetch P&L data:', err)
        })
        .finally(() => {
          setPnlLoading(false)
        })
    }
  }, [isOpen, employeeId])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            P&L Details - {employeeName}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          {pnlLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-gray-500">Loading P&L data...</div>
            </div>
          ) : pnlData ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 p-2 rounded-lg min-w-0">
                  <div className="text-xs text-green-600 font-medium">Total Revenue</div>
                  <div className="text-xs font-bold text-green-800">
                    ${pnlData.summary.totalRevenue.toLocaleString()}
                  </div>
                </div>
                <div className="bg-red-50 p-2 rounded-lg min-w-0">
                  <div className="text-xs text-red-600 font-medium">Total Cost</div>
                  <div className="text-xs font-bold text-red-800">
                    ${pnlData.summary.totalCost.toLocaleString()}
                  </div>
                </div>
                <div className={`p-2 rounded-lg min-w-0 ${
                  pnlData.summary.netProfit >= 0 ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <div className={`text-xs font-medium ${
                    pnlData.summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    Net Profit
                  </div>
                  <div className={`text-xs font-bold ${
                    pnlData.summary.netProfit >= 0 ? 'text-green-800' : 'text-red-800'
                  }`}>
                    ${pnlData.summary.netProfit.toLocaleString()}
                  </div>
                </div>
                <div className={`p-2 rounded-lg min-w-0 ${
                  pnlData.summary.roi >= 0 ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <div className={`text-xs font-medium ${
                    pnlData.summary.roi >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ROI
                  </div>
                  <div className={`text-xs font-bold ${
                    pnlData.summary.roi >= 0 ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {pnlData.summary.roi.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Chart */}
              <PnLChart records={pnlData.records} />

              {/* Detailed Table */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Year-by-Year Breakdown</h3>
                <PnLTable records={pnlData.records} showNotes={true} />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48">
              <div className="text-gray-500">No P&L data available</div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
