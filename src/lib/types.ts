




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
  accountType?: 'pribadi' | 'keluarga';
  accountNumber?: string;
  bankName?: string;
  accountHolderName?: string;
  bankBookPhoto?: string;
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  bpjsStatus?: 'active' | 'inactive' | 'not-registered';
  bpjsNumber?: string;
  bpjsType?: 'miki' | 'iba';
  employeeStatus?: 'active' | 'nonaktif' | 'resign' | 'phk' | 'pending';
  ktpPhoto?: string;
  simPhoto?: string;
  sioPhoto?: string;
  kartuKeluargaPhoto?: string;
  npwpNumber?: string;
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
  contractDurationMonths?: number;
  positions?: string[]; // Changed from position: string
  shift?: 'Regular' | 'Shift A' | 'Shift B';
  siteLocation?: string;
  password?: string;
  onLeave?: boolean;
  daysActive?: number;
  leaveHistory?: LeaveRequest[];
  canGeneratePayslip?: boolean;
  koperasiLimit?: number;
  koperasiLimitStartDate?: Date | string;
  koperasiLimitEndDate?: Date | string;
  latestViolation?: {
    status: ViolationRecord['status'];
    date: Date | string;
    expiresInDays: number;
  };
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
    siteIds?: string[];
    positionName?: string;
    projectAccess?: 'all' | 'assigned';
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
    status: 'Pending' | 'Approved by Admin Proyek' | 'Approved' | 'Rejected';
    reason: string;
};

export type Position = {
    id: string;
    name: string;
    salaryType?: 'jam' | 'harian' | 'bulanan' | 'direksi';
    projectName?: string;
    // Harian
    dailyWage?: number;
    // Jam
    hourlyRate?: number;
    // Lembur
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
};

export type AppSettings = {
  id?: string;
  appName?: string;
  appDescription?: string;
  logo?: string;
  favicon?: string;
  primaryColor?: string;
  backgroundColor?: string;
  accentColor?: string;
  language?: 'id' | 'en';
  employeePayslipAccess?: boolean;
}

export type AttendanceRecord = {
    id: string; // Will be composite key like `employeeId_period`
    employeeId: string;
    employeeName: string;
    period: string; // YYYY-MM
    date: string; // For date range queries
    attendanceByPosition?: Record<string, number>; // e.g., { 'Operator': 20, 'Welder': 5 }
    overtimeByPosition?: Record<string, number>;
    potonganIdCard?: number;
    potonganSimper?: number;
    potonganDenda?: number;
    potonganPph?: number;
    potonganKoperasi?: number;
    potonganHse?: number;
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
    verifiedDate?: Date | string;
    approvedDate?: Date | string;
    readyDate?: Date | string;
    items: PurchaseRequestItem[];
    totalEstimatedPrice: number;
    totalActualPrice?: number;
    status: 'Pending' | 'Verified by Purchasing' | 'Processing' | 'Approved by Finance' | 'Rejected' | 'Ready for Pickup' | 'Completed';
    purchasingNotes?: string;
    financeNotes?: string;
    rejectionReason?: string;
};


// Composite type for pages that need employee data with full position details
export type EmployeeWithPosition = Employee & {
  positionDetails?: Position[]; // Changed from Position
}

// Composite type for payroll page
export type EmployeeWithDetails = Employee & {
  positionDetails?: Position[]; // Changed from Position
  netSalary: number;
  totalEarnings: number;
  totalDeductions: number;
  earnings: Record<string, number>;
  deductions: Record<string, number>;
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

export type KoperasiItem = {
  id: string;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string;
};

export type KoperasiOrderItem = {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
};

export type KoperasiOrder = {
  id: string;
  employeeId: string;
  employeeName: string;
  orderDate: Date | string;
  items: KoperasiOrderItem[];
  totalPrice: number;
  status: 'Pending' | 'Approved' | 'Ready for Pickup' | 'Completed' | 'Rejected';
  pickupInfo?: {
      day: string;
      date: Date | string;
      location: string;
  };
  completionPhotoUrl?: string;
  rejectionReason?: string;
};

export type PayrollRecord = {
    id: string;
    employeeId: string;
    employeeName: string;
    period: string; // YYYY-MM
    generationDate: Date | string;
    earnings: Record<string, number>;
    deductions: Record<string, number>;
    totalEarnings: number;
    totalDeductions: number;
    netSalary: number;
    bankName?: string;
    accountNumber?: string;
    keterangan?: string;
}

export type HseCategory = 'incident' | 'inspection' | 'risk' | 'plan';

export type HseRecord = {
    id: string;
    category: HseCategory;
    title: string;
    description: string;
    date: Date | string;
    fileUrl?: string;
    fileName?: string;
    projectId?: string;
    projectName?: string;
    // Incident specific
    hasFine?: boolean;
    fineAmount?: number;
    fineAttachmentUrl?: string;
    departmentName?: string;
    positionName?: string;
    employeeId?: string;
    employeeName?: string;
    fineDeductionPeriods?: number;
    fineDeductionsApplied?: number;
}

export type DriverAttendance = {
    id?: string;
    driverId: string;
    driverName: string;
    timestamp: Date | string;
    type: 'check-in' | 'check-out';
    latitude: number;
    longitude: number;
    photoUrl: string;
};

export type PjAttendance = {
    id?: string;
    pjId: string;
    pjName: string;
    timestamp: Date | string;
    type: 'Masuk' | 'Pulang' | 'Izin' | 'Sakit';
    latitude: number;
    longitude: number;
    photoUrl?: string;
    keterangan?: string;
};


export type P2hReport = {
    id?: string;
    driverId: string;
    driverName: string;
    timestamp: Date | string;
    unitId: string;
    photoUrl: string;
    notes: string;
};

export type UnitConditionReport = {
    id?: string;
    driverId: string;
    driverName: string;
    timestamp: Date | string;
    unitId: string;
    notes: string;
};

export type Vehicle = {
    id: string;
    fleetNumber: string;
    category: 'LV' | 'BUS';
};

export type ViolationRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeePosition: string;
  siteLocation: string;
  date: Date | string;
  status: 'SP1' | 'SP2' | 'SP3' | 'SPPT';
  description: string;
  fileUrl?: string;
  fileName?: string;
};
