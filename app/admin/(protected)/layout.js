import { requireAdminPageSession } from "../../../lib/admin-auth";

export default function ProtectedAdminLayout({ children }) {
  requireAdminPageSession();
  return children;
}
