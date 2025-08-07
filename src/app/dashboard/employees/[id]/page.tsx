import Link from 'next/link';
import { notFound } from 'next/navigation';
import { employees } from '@/lib/data';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, MapPin, Phone } from 'lucide-react';

export default function EmployeeProfilePage({ params }: { params: { id: string } }) {
  const employee = employees.find((e) => e.id === params.id);

  if (!employee) {
    notFound();
  }

  return (
    <div className="space-y-6">
       <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Directory
            </Link>
        </Button>

      <Card>
        <CardHeader className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <Avatar className="h-24 w-24 border-4 border-primary/20">
            <AvatarImage src={employee.avatar} alt={employee.name} />
            <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-3xl font-bold">{employee.name}</h2>
            <p className="text-lg text-muted-foreground">{employee.role}</p>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <a href={`mailto:${employee.email}`} className="text-primary hover:underline">
                    {employee.email}
                </a>
            </div>
            <div className="flex items-center gap-4">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <span>{employee.phone}</span>
            </div>
            <div className="flex items-center gap-4">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <span>{employee.location}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Department & Role</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><span className="font-semibold">Department:</span> {employee.department}</p>
            <p><span className="font-semibold">Role:</span> {employee.role}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
