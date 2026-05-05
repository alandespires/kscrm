import { useTenant } from "@/contexts/tenant-context";

export function useIsSchool() {
  const { current } = useTenant();
  return (current?.tenant as any)?.segmento === "escolar";
}
