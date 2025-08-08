

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
  onLeave?: boolean;
  daysActive?: number;
  leaveHistory?: LeaveRequest[];
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
};

export type Role = {
    id: string;
    name: string;
    description: string;
};

export type LeaveRequest = {
    id: string;
    employeeId: string;
    employeeName: string;
    startDate: Date;
    endDate: Date;
    type: 'Annual Leave' | 'Sick Leave' | 'Unpaid Leave' | 'Other';
    reason: string;
    status: 'Pending' | 'Approved' | 'Rejected';
};

export type Position = {
    id: string;
    name: string;
};

export type AppSettings = {
  id?: string;
  appName?: string;
  appDescription?: string;
  logo?: string;
  primaryColor?: string;
  backgroundColor?: string;
  accentColor?: string;
}
