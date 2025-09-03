

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
  bpjsStatus?: 'active' | 'inactive';
  bpjsType?: 'miki' | 'iba';
  employeeStatus?: 'active' | 'nonaktif' | 'resign' | 'phk';
  ktpPhoto?: string;
  simPhoto?: string;
  sioPhoto?: string;
  simperNumber?: string;
  idCardNumber?: string;
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
  // Salary fields are now in the Position type
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

export type User = {
    id: string;
    name: string;
    email: string;
    role: string;
    password?: string;
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


export type AppSettings = {
  id?: string;
  appName?: string;
  appDescription?: string;
  logo?: string;
  primaryColor?: string;
  backgroundColor?: string;
  accentColor?: string;
  language?: 'id' | 'en';
}

export type AttendanceRecord = {
    id: string; // Will be composite key like `employeeId_period`
    employeeId: string;
    employeeName: string;
    period: string; // YYYY-MM
    attendanceDays?: number;
    overtimeHours?: number;
    potonganIdCard?: number;
    potonganSimper?: number;
    potonganDenda?: number;
    bonus?: number;
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
