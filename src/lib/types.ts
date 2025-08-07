
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
};

export type CalendarEvent = {
  date: Date;
  title: string;
  type: 'leave' | 'holiday' | 'event';
};
