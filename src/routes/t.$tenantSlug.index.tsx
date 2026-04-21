import { createFileRoute, Outlet } from "@tanstack/react-router";
// Re-export do dashboard atual sob path tenanted
import DashboardPage from "@/routes/index";

export const Route = createFileRoute("/t/$tenantSlug/")({
  component: () => <DashboardPage />,
});
