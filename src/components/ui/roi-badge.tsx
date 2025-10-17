'use client'

import { cn } from '@/lib/utils'

interface ROIBadgeProps {
  roi: number | null
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function ROIBadge({ roi, className, size = 'md' }: ROIBadgeProps) {
  if (roi === null || roi === undefined) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full font-medium px-2 py-1 text-xs',
          'bg-gray-100 text-gray-500',
          className
        )}
      >
        N/A
      </span>
    )
  }

  const isPositive = roi >= 0
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        sizeClasses[size],
        isPositive
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800',
        className
      )}
    >
      {isPositive ? '+' : ''}{roi.toFixed(1)}%
    </span>
  )
}
