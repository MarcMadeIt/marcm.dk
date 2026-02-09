"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { readUserSession } from "@/lib/auth/readUserSession";

const ProtectSettingsRoute = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const [accessDenied, setAccessDenied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const session = await readUserSession();
      if (session) {
        const allowedRoles = ["admin", "developer"];
        if (
          (pathname === "/admin/settings" || pathname === "/admin") &&
          !allowedRoles.includes(session.role)
        ) {
          setAccessDenied(true);
        }
      } else {
        setAccessDenied(true);
      }
      setLoading(false);
    })();
  }, [pathname]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen"></div>;
  }

  if (accessDenied) {
    return (
      <div className="flex items-center justify-center h-60 md:h-screen">
        <p className="text-center text-sm text-gray-500">Adgang nægtet</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectSettingsRoute;
