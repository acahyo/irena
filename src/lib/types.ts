export type Employee = {
  id: string;
  name: string;
  avatar: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  location: string;
};

export type CalendarEvent = {
  date: Date;
  title: string;
  type: 'leave' | 'holiday' | 'event';
};
