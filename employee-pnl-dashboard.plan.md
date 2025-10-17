# Employee P&L Dashboard Feature

## Overview

Create a financial performance tracking system that displays attributed revenue and total costs (beyond just salary) for each employee, broken down by year since hire date.

## Database Schema Changes

Update `prisma/schema.prisma` to add a new `EmployeePnL` model:

- `id`, `employeeId` (relation to Employee)
- `year` (integer)
- `attributedRevenue` (float) - revenue credited to this employee
- `totalCost` (float) - full cost including salary, benefits, overhead
- `notes` (optional text) - explanation of attribution
- Unique constraint on `[employeeId, year]`

## Seed Data Generation

Update `prisma/seed.ts` to generate realistic P&L data:

- For each employee, create records for each year from hire date to present
- Revenue attribution based on role:
- Executives: $2M-$5M/year (strategic value)
- Engineering Managers: $800K-$1.5M/year
- Senior Engineers: $500K-$800K/year
- Mid-level: $300K-$500K/year
- Junior: $150K-$300K/year
- Total costs = salary × 1.4 (benefits, equipment, overhead)
- Add year-over-year growth (5-15% for good performers)
- Add some variance/randomness for realism

## API Endpoints

Create `/src/app/api/employees/[id]/pnl/route.ts`:

- `GET` - fetch P&L history for specific employee
- Returns array of P&L records sorted by year

Create `/src/app/api/analytics/pnl/route.ts`:

- `GET` - aggregated P&L data (optional filters by department, year range)
- Returns summary statistics and top performers

## Employee Details Enhancement

Update `/src/app/employees/page.tsx` to show P&L summary in employee rows:

- Add "ROI" column showing lifetime profit/loss ratio
- Add visual indicator (color coding) for profitability

## P&L Detail View

Create new component or expand existing employee detail dialog:

- Display year-by-year table with columns: Year, Revenue, Total Cost, Profit, ROI%
- Show sparkline/mini chart of profit trend over years
- Calculate and display lifetime metrics:
- Total attributed revenue
- Total cost
- Net profit
- Average ROI percentage
- Add visual chart (bar or line chart) using a lightweight library like Recharts

## Org Chart Integration

Update `/src/app/org-chart/page.tsx`:

- Add P&L summary to employee node tooltip/detail view
- Show current year ROI badge on nodes (color-coded: green for positive, red for negative)
- Option to size nodes by revenue attribution (toggle feature)

## Analytics Dashboard (Bonus)

Create `/src/app/analytics/page.tsx` for company-wide insights:

- Department-level P&L comparison
- Top performers by ROI
- Year-over-year company growth
- Cost efficiency trends

## UI Components

- Create reusable `PnLTable` component for displaying P&L data
- Create `PnLChart` component for visualizations
- Add ROI badge/chip component with color coding
- Style with existing Tailwind + shadcn/ui patterns

## Key Implementation Details

- Use realistic business logic: costs include ~40% overhead on salary
- Show profit = revenue - total cost
- ROI% = (profit / total cost) × 100
- Handle edge cases: new employees (partial year), terminated employees
- Make data look professional and believable for interview demo
