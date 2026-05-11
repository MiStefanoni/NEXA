import { redirectIfAdminAuthenticated } from "../../../lib/admin-auth";
import { AdminLoginForm } from "../../../components/admin-login-form";

export const metadata = {
  title: "Admin Login | Nexa",
  description: "Secure administrative access for Nexa.",
};

export default function AdminLoginPage() {
  redirectIfAdminAuthenticated();

  return <AdminLoginForm />;
}
