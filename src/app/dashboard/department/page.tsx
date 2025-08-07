import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function DepartmentPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Departments</CardTitle>
        <CardDescription>
          Manage your company departments here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>Department management features will be implemented here.</p>
      </CardContent>
    </Card>
  );
}
