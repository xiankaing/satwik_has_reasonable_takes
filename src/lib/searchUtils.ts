import Fuse from 'fuse.js'

interface Employee {
  id: string
  name: string
  title: string
  department: string
  email: string
  phone?: string
  hireDate: string
  salary: number
  status: string
  manager?: {
    id: string
    name: string
    title: string
  }
}

// Common search acronyms mapping
const commonAcronyms: { [key: string]: string[] } = {
  'SWE': ['Software Engineer', 'Senior Software Engineer'],
  'SE': ['Software Engineer', 'Senior Software Engineer'],
  'SSE': ['Senior Software Engineer'],
  'PM': ['Product Manager', 'Project Manager'],
  'CEO': ['Chief Executive Officer'],
  'CTO': ['Chief Technology Officer'],
  'CFO': ['Chief Financial Officer'],
  'COO': ['Chief Operating Officer'],
  'HR': ['Human Resources', 'HR Specialist', 'Director of Human Resources'],
  'EM': ['Engineering Manager'],
  'ENG': ['Engineering', 'Engineering Manager'],
  'FIN': ['Finance', 'Finance Manager', 'Financial'],
  'FM': ['Finance Manager'],
  'FA': ['Financial Analyst'],
  'DEV': ['Developer', 'Software Developer'],
  'QA': ['Quality Assurance', 'QA Engineer'],
  'UX': ['UX Designer', 'User Experience Designer'],
  'UI': ['UI Designer', 'User Interface Designer'],
  'DS': ['Data Scientist'],
  'ML': ['Machine Learning Engineer'],
  'SRE': ['Site Reliability Engineer'],
  'DBA': ['Database Administrator'],
  'SA': ['System Administrator'],
  'BA': ['Business Analyst'],
  'SM': ['Scrum Master'],
  'PO': ['Product Owner'],
  'VP': ['Vice President'],
  'DIR': ['Director'],
  'MGR': ['Manager', 'Engineering Manager', 'Finance Manager', 'Product Manager', 'Project Manager'],
  'LEAD': ['Lead', 'Team Lead', 'Tech Lead'],
  'ARCH': ['Architect', 'Software Architect', 'Solution Architect'],
  'CONS': ['Consultant', 'Senior Consultant'],
  'SPEC': ['Specialist'],
  'COORD': ['Coordinator'],
  'SUPER': ['Supervisor'],
  'EXEC': ['Executive'],
  'ADMIN': ['Administrator'],
  'ANALYST': ['Analyst'],
  'DESIGNER': ['Designer'],
  'WRITER': ['Writer', 'Technical Writer'],
  'SUPPORT': ['Support', 'Customer Support'],
  'SALES': ['Sales', 'Sales Manager', 'Account Manager'],
  'MARKETING': ['Marketing', 'Marketing Manager'],
  'OPS': ['Operations', 'Operations Manager'],
  'SEC': ['Security', 'Security Engineer'],
  'COMPLIANCE': ['Compliance', 'Compliance Officer'],
  'LEGAL': ['Legal', 'Legal Counsel'],
  'COMMS': ['Communications', 'Communications Manager'],
  'PR': ['Public Relations', 'PR Manager']
}

export function searchEmployees(employees: Employee[], searchTerm: string, isExactMatch: boolean = false): Employee[] {
  if (!searchTerm.trim()) {
    return employees
  }

  const searchUpper = searchTerm.toUpperCase()
  
  // Exact match mode - simple case-insensitive search
  if (isExactMatch) {
    return employees.filter(employee => 
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  // First, check for common search acronyms and basic acronym matches
  const acronymMatches = employees.filter(employee => {
    // Check if search term matches common acronyms
    const commonAcronymMatch = commonAcronyms[searchUpper]?.some(acronymTitle => 
      employee.title.toLowerCase().includes(acronymTitle.toLowerCase())
    )
    
    // Check for multi-word acronym matches (e.g., "VP ENG" -> "Vice President Engineering")
    const multiWordAcronymMatch = searchUpper.split(' ').every(word => {
      const wordAcronyms = commonAcronyms[word]
      return wordAcronyms?.some(acronymTitle => 
        employee.title.toLowerCase().includes(acronymTitle.toLowerCase()) ||
        employee.department.toLowerCase().includes(acronymTitle.toLowerCase())
      )
    })
    
    // Basic acronym match - check if search term appears as acronym in title/department
    const basicMatch = employee.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      employee.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      employee.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Check for substring matches in common acronyms
    const basicAcronym = employee.title.split(' ').map(word => word.charAt(0)).join('').toLowerCase()
    const substringMatch = basicAcronym.includes(searchUpper.toLowerCase())
    
    return commonAcronymMatch || multiWordAcronymMatch || basicMatch || substringMatch
  })
  
  // Use Fuse.js for fuzzy search
  const fuse = new Fuse(employees, {
    keys: [
      { name: 'name', weight: 0.4 },
      { name: 'title', weight: 0.3 },
      { name: 'email', weight: 0.2 },
      { name: 'department', weight: 0.1 }
    ],
    threshold: searchTerm.length <= 3 ? 0.6 : 0.4, // More lenient for short searches
    includeScore: true,
    minMatchCharLength: 1,
    shouldSort: true,
  })

  const fuseResults = fuse.search(searchTerm)
  const fuseMatches = fuseResults.map(result => result.item)
  
  // Combine and deduplicate results, prioritizing acronym matches
  const allMatches = [...acronymMatches, ...fuseMatches]
  const uniqueMatches = allMatches.filter((employee, index, self) => 
    index === self.findIndex(emp => emp.id === employee.id)
  )
  
  return uniqueMatches
}
