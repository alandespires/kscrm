import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/routes/index";

export const Route = createFileRoute("/t/$tenantSlug/")({
  component: DashboardPage,
});
