import React, { useEffect, useState } from "react";
import { FaPen, FaTrash } from "react-icons/fa6";
import { getAllUsers, deleteUser } from "@/lib/server/actions";
import { readUserSession } from "@/lib/auth/readUserSession";
import { useTranslation } from "react-i18next";

interface User {
  id: string;
  email?: string;
  name?: string;
  role?: string;
}

const UserList = ({
  onUpdateUserClick,
  onUserDeleted,
}: {
  onUpdateUserClick: (userId: string) => void;
  onUserDeleted: () => void;
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const { t } = useTranslation();

  type UserRole = "admin" | "editor" | "developer";

  useEffect(() => {
    const fetchUserSession = async () => {
      const session = await readUserSession();
      if (session) {
        setCurrentUserRole(session.role);
      }
    };

    fetchUserSession();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const users = await getAllUsers();
        setUsers(users || []);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        setError("Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
  }, [isModalOpen]);

  const handleDelete = async () => {
    if (userToDelete) {
      try {
        await deleteUser(userToDelete.id);
        setUsers(users.filter((user) => user.id !== userToDelete.id));
        setUserToDelete(null);
        setIsModalOpen(false);
        onUserDeleted();
      } catch (error) {
        console.error("Failed to delete user:", error);
        setError("Failed to delete user");
      }
    }
  };

  const openModal = (user: User) => {
    setUserToDelete(user);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setUserToDelete(null);
    setIsModalOpen(false);
  };

  const handleUpdateClick = (userId: string) => {
    onUpdateUserClick(userId);
  };

  const canEditOrDelete = (userRole: string | undefined) => {
    if (
      !userRole ||
      !["admin", "editor", "developer"].includes(userRole) ||
      !currentUserRole
    ) {
      return false;
    }

    if (currentUserRole === "developer") {
      // Developers can edit/delete all users (admin, editor, developer)
      return true;
    }
    if (currentUserRole === "admin") {
      // Admins can edit/delete editors and other admins, but not developers
      return userRole !== "developer";
    }
    if (currentUserRole === "editor") {
      // Editors cannot edit/delete developers
      return userRole !== "developer";
    }
    return false;
  };

  return (
    <div>
      {loading ? (
        <div className="flex justify-center gap-3 items-center">
          <span className="loading loading-spinner loading-md h-52"></span>
          {t("loading_users")}
        </div>
      ) : (
        <>
          {error && <p className="text-red-500">{error}</p>}{" "}
          <ul className="flex flex-col gap-4 md:gap-5">
            {users.map((user) => (
              <React.Fragment key={user.id}>
                <li
                  key={user.id}
                  className=" flex justify-between items-center rounded-lg"
                >
                  <div className="flex gap-3 items-center ">
                    <div className="w-20 md:w-32">
                      <span className="badge badge-soft badge-primary capitalize">
                        {user.role === "admin"
                          ? t("admin")
                          : user.role === "editor"
                          ? t("editor")
                          : user.role === "developer"
                          ? t("developer")
                          : user.role}
                      </span>
                    </div>
                    <div className="w-20 md:w-32">
                      <span className="font-semibold md:font-bold text-xs md:text-base">
                        {user.name}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold md:font-bold text-xs md:text-base hidden md:block">
                        {user.email}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-5 items-center">
                    {canEditOrDelete(user.role) && (
                      <>
                        <button
                          className="btn btn-sm"
                          onClick={() => handleUpdateClick(user.id)}
                          aria-label={t("aria.edit_user_button", {
                            name: user.name,
                          })}
                        >
                          <FaPen size={17} />
                        </button>
                        <button
                          className="btn btn-sm"
                          onClick={() => openModal(user)}
                          aria-label={t("aria.delete_user_button", {
                            name: user.name,
                          })}
                        >
                          <FaTrash size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </li>
                <hr className="border-[1px] rounded-lg border-base-200" />
              </React.Fragment>
            ))}
          </ul>
        </>
      )}
      {isModalOpen && (
        <div className="modal modal-open" aria-labelledby="modal-title">
          <div className="modal-box">
            <h3 id="modal-title" className="font-bold text-lg">
              {t("delete_user_confirmation")}
            </h3>
            <p className="py-4">{t("delete_user_prompt")}</p>
            <p className="text-sm text-warning">{t("delete_user_warning")}</p>
            <div className="modal-action">
              <button
                className="btn"
                onClick={closeModal}
                aria-label={t("aria.cancel_button")}
              >
                {t("cancel")}
              </button>
              <button
                className="btn btn-error"
                onClick={handleDelete}
                aria-label={t("aria.confirm_delete_button")}
              >
                {t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;
