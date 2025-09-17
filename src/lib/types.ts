export type Allowance = {
  name: string;
  amount: number;
};

export type Employee = {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
  department?: string;
  email?: string;
  phone?: string;
  location?: string;
  nik?: string;
  placeOfBirth?: string;
  dateOfBirth?: Date | string;
  gender?: 'Laki-laki' | 'Perempuan';
  address?: string;
  accountNumber?: string;
  bankName?: string;
  accountHolderName?: string;
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  bpjsStatus?: 'active' | 'inactive' | 'not-registered';
  bpjsNumber?: string;
  bpjsType?: 'miki' | 'iba';
  employeeStatus?: 'active' | 'nonaktif' | 'resign' | 'phk';
  ktpPhoto?: string;
  simPhoto?: string;
  sioPhoto?: string;
  simperNumber?: string;
  simperStatus?: 'active' | 'in-progress' | 'not-registered';
  idCardNumber?: string;
  idCardStatus?: 'active' | 'in-progress' | 'not-registered';
  workContractNumber?: string;
  messRoomNumber?: string;
  messEntryDate?: Date | string;
  workEquipment?: string;
  contractStartDate?: Date | string;
  contractEndDate?: Date | string;
  position?: string;
  siteLocation?: string;
  password?: string;
  onLeave?: boolean;
  daysActive?: number;
  leaveHistory?: LeaveRequest[];
  canGeneratePayslip?: boolean;
};

export type CalendarEvent = {
  date: Date;
  title: string;
  type: 'leave' | 'holiday' | 'event';
};

export type Department = {
    id: string;
    name: string;
};

export type Site = {
    id: string;
    name: string;
    picId?: string;
    picName?: string;
    picContact?: string;
    supervisors?: { id: string, name: string }[];
};

export type User = {
    id: string;
    name: string;
    email: string;
    role: string;
    password?: string;
    avatar?: string;
    siteId?: string; // Added for project admin role
};

export type Role = {
    id: string;
    name: string;
    description: string;
    accessibleMenus?: string[];
};

export type LeaveRequest = {
    id: string;
    employeeId: string;
    employeeName: string;
    startDate: Date | string;
    endDate: Date | string;
    type: 'Annual Leave' | 'Sick Leave' | 'Unpaid Leave' | 'Other';
    reason: string;
    status: 'Pending' | 'Approved' | 'Rejected';
};

export type Position = {
    id: string;
    name: string;
    salaryType?: 'harian' | 'bulanan' | 'direksi';
    // Harian
    dailyWage?: number;
    overtimeRate?: number;
    // Bulanan or Direksi
    monthlySalary?: number; // Gaji Pokok
    tunjanganJabatan?: number;
    tunjanganKehadiran?: number;
    tunjanganKinerja?: number;
    // Dynamic Allowances for Bulanan
    allowances?: Allowance[];
};

export type MenuOrderItem = {
  id: string;
  isGroup?: boolean;
  subItems?: string[];
}

export type AppSettings = {
  id?: string;
  appName?: string;
  appDescription?: string;
  logo?: string;
  primaryColor?: string;
  backgroundColor?: string;
  accentColor?: string;
  language?: 'id' | 'en';
  menuOrder?: MenuOrderItem[];
  employeePayslipAccess?: boolean;
}

export type AttendanceRecord = {
    id: string; // Will be composite key like `employeeId_period`
    employeeId: string;
    employeeName: string;
    period: string; // YYYY-MM
    date: Date | string; // For date range queries
    attendanceDays?: number;
    overtimeHours?: number;
    potonganIdCard?: number;
    potonganSimper?: number;
    potonganDenda?: number;
    potonganPph?: number;
    bonus?: number;
};

export type PurchaseRequestItem = {
    name: string;
    quantity: number;
    unit: string;
    estimatedPrice?: number;
    actualPrice?: number;
};

export type PurchaseRequest = {
    id: string;
    projectId: string;
    projectName: string;
    requesterId: string;
    requesterName: string;
    requestDate: Date | string;
    items: PurchaseRequestItem[];
    totalEstimatedPrice: number;
    totalActualPrice?: number;
    status: 'Pending' | 'Verified by Purchasing' | 'Processing' | 'Approved by Finance' | 'Rejected' | 'Completed';
    purchasingNotes?: string;
    financeNotes?: string;
    rejectionReason?: string;
};


// Composite type for pages that need employee data with full position details
export type EmployeeWithPosition = Employee & {
  positionDetails?: Position;
}

// Composite type for payroll page
export type EmployeeWithDetails = Employee & {
  positionDetails?: Position;
  totalSalary?: number;
}

export type FinanceRecord = {
  id: string;
  projectId: string;
  projectName: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  date: Date | string;
  category?: string;
};
