

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
  dateOfBirth?: Date;
  address?: string;
  accountNumber?: string;
  bankName?: string;
  accountHolderName?: string;
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  bpjsStatus?: 'active' | 'inactive';
  employeeStatus?: 'active' | 'nonaktif' | 'resign' | 'phk';
  simPhoto?: string;
  sioPhoto?: string;
  simperNumber?: string;
  idCardNumber?: string;
  messRoomNumber?: string;
  messEntryDate?: Date;
  workEquipment?: string;
  contractStartDate?: Date;
  contractEndDate?: Date;
  position?: string;
  siteLocation?: string;
  onLeave?: boolean;
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

export type Position = {
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
