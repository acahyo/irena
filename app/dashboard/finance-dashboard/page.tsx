
import { getAdminSession } from '@/actions/auth';
import { redirect } from 'next/navigation';
import { getPayrollHistoryByPeriod } from '@/actions/payroll';
import { getPurchaseRequests } from '@/actions/purchasing';
import { getPaymentRequests } from '@/actions/payment-requests';
import { getSites } from '@/actions/sites';
import { getEmployees } from '@/actions/employees';
import FinanceDashboardClientPage from './client-page';
import type { PayrollRecord, PurchaseRequest, PaymentRequest, Site, Employee } from '@/lib/types';

export default async function FinanceDashboardPage() {
    const user = await getAdminSession();
    if (!user || (user.role !== 'Administrator' && user.role !== 'Finance')) {
        redirect('/dashboard');
    }

    const currentPeriod = new Date().toISOString().slice(0, 7);

    const [
        payrollHistory,
        purchaseRequests,
        paymentRequests,
        sites,
        employees
    ] = await Promise.all([
        getPayrollHistoryByPeriod(currentPeriod),
        getPurchaseRequests({}),
        getPaymentRequests({}),
        getSites(),
        getEmployees()
    ]);
    
    const siteNames = new Map(sites.map(s => [s.name, s.id]));
    const employeeSites = new Map(employees.map(e => [e.id, e.siteLocation]));

    const payrollByProject = payrollHistory.reduce((acc, record) => {
        const siteLocation = employeeSites.get(record.employeeId);
        const projectName = siteLocation || 'Unassigned';
        if (!acc[projectName]) {
            acc[projectName] = 0;
        }
        acc[projectName] += record.netSalary;
        return acc;
    }, {} as Record<string, number>);

    return (
        <FinanceDashboardClientPage
            payrollByProject={payrollByProject}
            purchaseRequests={purchaseRequests}
            paymentRequests={paymentRequests}
        />
    );
}
