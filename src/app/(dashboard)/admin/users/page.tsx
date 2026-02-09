import ProtectSettingsRoute from "@/components/admin/auth/ProtectSettingsRoute";
import NavUsers from "@/components/admin/users/NavUsers";


const Users = () => {
  return (
    <ProtectSettingsRoute>
      <div className="w-full">
        <NavUsers />
      </div>
    </ProtectSettingsRoute>
  );
};

export default Users;
