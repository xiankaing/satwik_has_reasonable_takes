# Lightweight HRIS System

A modern, web-based Human Resource Information System built with Next.js, TypeScript, and SQLite. This system provides core employee management functionality including organizational chart visualization, employee data editing, and export capabilities.

## Features

### Core Features
- **Employee Directory**: Complete employee management with search and filtering
- **Organizational Chart**: Interactive visualization of company hierarchy using React Flow
- **Data Export**: CSV export functionality for employee data
- **CRUD Operations**: Create, read, update, and delete employee records
- **Search & Filter**: Search by name, title, email, and filter by department
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### Employee Management
- Employee profiles with comprehensive information (name, title, department, contact info, salary, etc.)
- Manager-employee relationships for organizational hierarchy
- Status tracking (active, inactive, terminated)
- Hire date tracking and salary management

### Organizational Chart
- Interactive tree visualization of company structure
- Click-to-view employee details
- Auto-layout with proper spacing and hierarchy
- Visual indicators for employee status

## Tech Stack

- **Frontend**: Next.js 15 with TypeScript and App Router
- **Styling**: Tailwind CSS with shadcn/ui components
- **Database**: SQLite with Prisma ORM
- **Visualization**: React Flow for organizational chart
- **Export**: CSV generation for data export

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/xiankaing/satwik_has_reasonable_takes.git
   cd satwik_has_reasonable_takes
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   npx prisma migrate dev
   ```

4. **Seed the database with sample data**
   ```bash
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Employee Directory
- View all employees in a sortable table
- Use the search bar to find employees by name, title, or email
- Filter employees by department using the dropdown
- Click "Add Employee" to create new employee records
- Edit existing employees by clicking the edit button
- Delete employees (with confirmation) using the delete button
- Export all employee data to CSV using the "Export CSV" button

### Organizational Chart
- Navigate to the organizational chart from the employee directory
- View the interactive company hierarchy
- Click on any employee node to see detailed information
- Use the controls to zoom, pan, and fit the chart to view
- Navigate back to the employee directory using the back button

## Database Schema

The system uses a single `Employee` model with the following fields:

- `id`: Unique identifier (CUID)
- `name`: Employee's full name
- `title`: Job title/position
- `department`: Department/team
- `email`: Email address
- `phone`: Phone number (optional)
- `hireDate`: Date of hire
- `salary`: Annual salary
- `status`: Employment status (active, inactive, terminated)
- `managerId`: Reference to manager (self-referential)
- `createdAt`: Record creation timestamp
- `updatedAt`: Last update timestamp

## API Endpoints

- `GET /api/employees` - List all employees (with optional search/filter)
- `POST /api/employees` - Create new employee
- `GET /api/employees/[id]` - Get specific employee
- `PUT /api/employees/[id]` - Update employee
- `DELETE /api/employees/[id]` - Delete employee
- `GET /api/employees/export` - Export employees as CSV

## Sample Data

The seed script creates a realistic organizational structure with:
- CEO and C-level executives
- Department heads and managers
- Individual contributors across different departments
- Proper reporting relationships and hierarchy

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:seed` - Seed database with sample data

### Database Commands

- `npx prisma migrate dev` - Run database migrations
- `npx prisma generate` - Generate Prisma client
- `npx prisma studio` - Open Prisma Studio (database GUI)

## Project Structure

```
src/
├── app/
│   ├── api/employees/          # API routes
│   ├── employees/              # Employee directory page
│   ├── org-chart/              # Organizational chart page
│   └── globals.css             # Global styles
├── components/
│   └── ui/                     # shadcn/ui components
├── lib/
│   └── prisma.ts              # Prisma client singleton
prisma/
├── schema.prisma              # Database schema
├── seed.ts                    # Seed script
└── migrations/                # Database migrations
```

## Future Enhancements

This MVP focuses on core functionality. Potential future enhancements include:

- Authentication and role-based access control
- Team management features
- Audit logging and change history
- Bulk CSV import functionality
- PDF export capabilities
- Advanced reporting and analytics
- Employee photo uploads
- Performance reviews and goal tracking

## License

This project is created for interview purposes and demonstrates modern full-stack development practices with Next.js, TypeScript, and modern tooling.