-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "hireDate" DATETIME NOT NULL,
    "salary" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "managerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "employees_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
