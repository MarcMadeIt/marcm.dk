"use client";

import React, { useState } from "react";
import UserList from "./UserList";
import Register from "./register/Register";
import UpdateUser from "./update/UpdateUser";
import { FaAngleLeft } from "react-icons/fa6";
import { useTranslation } from "react-i18next";

const Users = () => {
  const [showRegister, setShowRegister] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleUserCreated = () => {
    setShowRegister(false);
    setToastMessage(t("user_created"));
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleUserUpdated = () => {
    setShowUpdate(false);
    setToastMessage(t("user_updated"));
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleUserDeleted = () => {
    setToastMessage(t("user_deleted"));
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleUpdateUserClick = (userId: string) => {
    setSelectedUserId(userId);
    setShowUpdate(true);
  };

  return (
    <div className="flex flex-col gap-8 bg-base-200 rounded-box shadow-md p-5 md:p-7">
      {showRegister ? (
        <div className="flex flex-col items-start gap-5">
          <button
            onClick={() => setShowRegister(false)}
            className="btn btn-ghost "
          >
            <FaAngleLeft />
            {t("back")}
          </button>
          <Register onUserCreated={handleUserCreated} />
        </div>
      ) : showUpdate && selectedUserId ? (
        <div className="flex flex-col items-start gap-5">
          <button
            onClick={() => setShowUpdate(false)}
            className="btn btn-ghost "
          >
            <FaAngleLeft />
            {t("back")}
          </button>
          <UpdateUser
            userId={selectedUserId}
            onUserUpdated={handleUserUpdated}
          />
        </div>
      ) : (
        <>
          <div>
            <button
              onClick={() => setShowRegister(true)}
              className="btn btn-primary btn-sm md:btn-md"
            >
              {t("create_user")}
            </button>
          </div>

          <div>
            <UserList
              onUpdateUserClick={handleUpdateUserClick}
              onUserDeleted={handleUserDeleted}
            />
          </div>
        </>
      )}
      {showToast && (
        <div className="toast bottom-20 md:bottom-0 toast-end">
          <div className="alert alert-success text-neutral-content">
            <span className="text-base md:text-lg">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
