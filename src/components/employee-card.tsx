import Link from 'next/link';
import type { Employee } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Phone, Building, Calendar, User, FileText, Clock, Briefcase } from 'lucide-react';
import { Badge } from './ui/badge';

interface EmployeeCardProps {
  employee: Employee;
}

const getStatusBadge = (status?: string) => {
    switch(status) {
        case 'active':
            return <Badge variant="default" className="absolute top-2 right-2">Aktif</Badge>;
        case 'pending':
            return <Badge variant="secondary" className="absolute top-2 right-2 bg-yellow-100 text-yellow-800">Pending</Badge>;
        case 'nonaktif':
            return <Badge variant="outline" className="absolute top-2 right-2">Non-Aktif</Badge>;
        case 'onLeave':
            return <Badge variant="destructive" className="absolute top-2 right-2">Cuti</Badge>;
        default:
            return null;
    }
}


export function EmployeeCard({ employee }: EmployeeCardProps) {
  const displayPosition = employee.positions && employee.positions.length > 0
    ? employee.positions.join(', ')
    : 'No position';
    
  return (
    <Link href={`/dashboard/employees/${employee.id}`}>
      <Card className="h-full flex flex-col transform-gpu transition-all duration-200 ease-in-out hover:-translate-y-1 hover:shadow-lg">
        <CardHeader className="items-center text-center">
            {employee.onLeave ? getStatusBadge('onLeave') : getStatusBadge(employee.employeeStatus)}
            <Avatar className="h-24 w-24 border-2 border-primary/20">
              <AvatarImage src={employee.avatar} alt={employee.name} />
              <AvatarFallback>{employee.name ? employee.name.charAt(0) : '?'}</AvatarFallback>
            </Avatar>
            <div className="w-full truncate pt-4">
              <CardTitle className="truncate">{employee.name || 'No Name'}</CardTitle>
              <CardDescription className="truncate">{displayPosition}</CardDescription>
              <CardDescription className="truncate text-xs pt-1">{employee.idCardNumber || 'No ID Card'}</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="flex-grow space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <span>{employee.department || 'No department'}</span>
            </div>
             <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>{employee.phone || 'No phone'}</span>
            </div>
        </CardContent>
        <CardFooter className="flex-col items-start gap-2 text-xs text-muted-foreground border-t pt-4">
             <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Mulai: {employee.contractStartDate || 'N/A'}</span>
            </div>
             <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Selesai: {employee.contractEndDate || 'N/A'}</span>
            </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
