import Overview from "@/components/admin/overview/Overview";
import ProtectSettingsRoute from "@/components/admin/auth/ProtectSettingsRoute";
import React from "react";

const AdminPage = () => {
  return (
    <ProtectSettingsRoute>
      <div className="relative">
        <Overview />
      </div>
    </ProtectSettingsRoute>
  );
};

export default AdminPage;
