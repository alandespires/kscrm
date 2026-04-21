import { createFileRoute } from "@tanstack/react-router";
import { Route as IndexRoute } from "@/routes/index";

export const Route = createFileRoute("/t/$tenantSlug/")({
  component: IndexRoute.options.component!,
});
