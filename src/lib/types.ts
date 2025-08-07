

export type Employee = {
  id: string;
  name: string;
  avatar: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  location: string;
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
  simPhoto?: string;
  sioPhoto?: string;
  simperNumber?: string;
  idCardNumber?: string;
  messRoomNumber?: string;
  messEntryDate?: Date;
  contractStartDate?: Date;
  contractEndDate?: Date;
  position?: string;
  siteLocation?: string;
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
