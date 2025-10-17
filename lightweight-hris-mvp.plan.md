# Lightweight HRIS MVP Implementation Plan

## Tech Stack

- **Frontend/Backend**: Next.js 14 with TypeScript, App Router
- **Database**: SQLite with Prisma ORM
- **Styling**: Tailwind CSS + shadcn/ui components
- **Org Chart**: React Flow
- **Export**: CSV export functionality

## Implementation Steps

### 1. Project Setup

- Initialize Next.js project with TypeScript
- Install dependencies: Prisma, React Flow, shadcn/ui, csv export libraries
- Configure Tailwind CSS
- Set up project structure

### 2. Database Schema & Prisma Setup

Create `prisma/schema.prisma` with Employee model:

- id, name, title, department, managerId (self-relation), email, phone, hireDate, salary, status
- Set up SQLite as datasource
- Run migrations and generate Prisma client

### 3. Seed Data

Create seed script with ~10-15 sample employees showing realistic org hierarchy (CEO → VPs → Managers → ICs)

### 4. API Routes

Create Next.js API routes in `app/api/`:

- `GET /api/employees` - list all employees with optional search/filter
- `POST /api/employees` - create employee
- `PUT /api/employees/[id]` - update employee
- `DELETE /api/employees/[id]` - delete employee
- `GET /api/employees/export` - CSV export

### 5. Employee Directory Page

Build main employee table (`app/employees/page.tsx`):

- Display all employees in a sortable table
- Search bar (filter by name, title, department)
- Add/Edit/Delete buttons with modal forms
- Link to org chart view

### 6. Employee Form Component

Reusable form for Add/Edit with fields:

- Name, Title, Department, Manager (dropdown), Email, Phone, Hire Date, Salary, Status
- Form validation
- Submit to API routes

### 7. Org Chart Page

Build interactive org chart (`app/org-chart/page.tsx`):

- Use React Flow to render hierarchy from manager relationships
- Auto-layout nodes in tree structure
- Click node to view employee details
- Basic expand/collapse functionality

### 8. CSV Export Feature

- Server-side CSV generation from employee data
- Download trigger from employee directory
- Include all employee fields in export

### 9. UI Polish

- Responsive layout with navigation
- Clean, professional styling with Tailwind
- Basic shadcn/ui components (Button, Table, Dialog, Form inputs)
- Loading states and error handling

### 10. Documentation

Create `README.md` with:

- Project overview and features
- Setup instructions (npm install, prisma migrate, npm run dev)
- Seed data command
- Tech stack details

## Key Files to Create

- `prisma/schema.prisma` - database schema
- `prisma/seed.ts` - seed data
- `app/api/employees/route.ts` - CRUD endpoints
- `app/employees/page.tsx` - employee directory
- `app/org-chart/page.tsx` - org chart visualization
- `components/EmployeeForm.tsx` - add/edit form
- `components/ui/*` - shadcn components
- `lib/prisma.ts` - Prisma client singleton
- `README.md` - documentation

## Out of Scope (for 2h MVP)

- Authentication/RBAC
- Teams feature
- Audit logs/change history
- Bulk CSV import
- PDF export
- Drag-and-drop org chart editing
- Deployment to Vercel (can be done post-interview)
