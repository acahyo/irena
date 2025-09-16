import { getEmployees } from '@/actions/employees';
import { getPositions } from '@/actions/positions';
import PayrollClientPage from './client-page';
import { getAttendanceByPeriod } from '@/actions/attendance';
import type { EmployeeWithDetails } from '@/lib/types';


export default async function PayrollPage({ userSiteId }: { userSiteId?: string }) {
  const [employees, positions] = await Promise.all([
    getEmployees({ siteId: userSiteId }),
    getPositions()
  ]);

  // We can fetch initial attendance for the current month to calculate salary for daily workers
  const currentPeriod = new Date().toISOString().slice(0, 7);
  const initialAttendance = await getAttendanceByPeriod(currentPeriod);
  
  const employeesWithDetails: EmployeeWithDetails[] = employees.map(emp => {
      const positionDetails = positions.find(p => p.name === emp.position);
      const attendanceDetails = initialAttendance.find(a => a.employeeId === emp.id);

      let totalSalary = 0;
      if (positionDetails) {
          if (positionDetails.salaryType === 'bulanan' || positionDetails.salaryType === 'direksi') {
              const baseSalary = positionDetails.monthlySalary || 0;
              const allowancesTotal = positionDetails.allowances?.reduce((sum, allowance) => sum + allowance.amount, 0) || 0;
              totalSalary = baseSalary + allowancesTotal;
          } else if (positionDetails.salaryType === 'harian') {
              const attendanceDays = attendanceDetails?.attendanceDays || 0;
              const overtimeHours = attendanceDetails?.overtimeHours || 0;
              totalSalary = ((positionDetails.dailyWage || 0) * attendanceDays) + 
                            ((positionDetails.overtimeRate || 0) * overtimeHours);
          }
      }

      return { 
          ...emp, 
          positionDetails,
          totalSalary: totalSalary
      };
  });

  return (
    <PayrollClientPage
      employees={employeesWithDetails}
    />
  );
}
