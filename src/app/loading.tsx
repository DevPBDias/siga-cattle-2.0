"use client";

import { TenantLoadingScreen } from "@/components/loading/TenantLoadingScreen";
import { getActiveTenant } from "@/config/tenant";

export function LoadingScreen() {
  const { tenant } = getActiveTenant();
  return <TenantLoadingScreen tenantConfig={tenant ?? undefined} />;
}

export default LoadingScreen;
