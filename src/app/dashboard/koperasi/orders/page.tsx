import { getKoperasiOrders } from "@/actions/koperasi";
import KoperasiOrdersClientPage from "./client-page";
import { getAdminSession } from "@/actions/auth";
import { redirect } from "next/navigation";
import { getSites } from "@/actions/sites";
import { getEmployees } from "@/actions/employees";

export default async function KoperasiOrdersPage() {
    const user = await getAdminSession();
    if (!user || (user.role !== 'Administrator' && user.role !== 'Purchasing')) {
        redirect('/dashboard');
    }
    
    const [orders, employees] = await Promise.all([
        getKoperasiOrders({}),
        getEmployees(),
    ]);

    const ordersWithEmployeeDetails = orders.map(order => {
        const employee = employees.find(emp => emp.id === order.employeeId);
        return {
            ...order,
            employeeAvatar: employee?.avatar,
            employeePosition: employee?.position
        }
    });

    return <KoperasiOrdersClientPage initialOrders={ordersWithEmployeeDetails} />;
}
