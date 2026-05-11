import { AdminDashboard } from "../../../components/admin-dashboard";
import { getDashboardData } from "../../../lib/admin-store";

export const metadata = {
  title: "Admin | Nexa",
  description: "Administrative workflow for Nexa profiles and applications.",
};

export default async function AdminDashboardPage() {
  const initialData = await getDashboardData();
  return <AdminDashboard initialData={initialData} />;
}
