"use client";

import ProtectedClient from "@/components/auth/WrapperAuth";
import { MobileFooter } from "@/components/layout/MobileFooter";
import { ReportsProvider } from "@/context/ReportsContext";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedClient>
      <ReportsProvider>
        {children}
        <MobileFooter />
      </ReportsProvider>
    </ProtectedClient>
  );
}
