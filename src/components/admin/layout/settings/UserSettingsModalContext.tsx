"use client";

import React, { createContext, useContext, useRef, ReactNode } from "react";

interface UserSettingsModalContextType {
  dialogRef: React.RefObject<HTMLDialogElement>;
  openModal: () => void;
  closeModal: () => void;
}

const UserSettingsModalContext = createContext<
  UserSettingsModalContextType | undefined
>(undefined);

export function UserSettingsModalProvider({
  children,
}: {
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const openModal = () => {
    dialogRef.current?.showModal();
  };

  const closeModal = () => {
    dialogRef.current?.close();
  };

  return (
    <UserSettingsModalContext.Provider
      value={{ dialogRef, openModal, closeModal }}
    >
      {children}
    </UserSettingsModalContext.Provider>
  );
}

export const useUserSettingsModal = () => {
  const context = useContext(UserSettingsModalContext);
  if (context === undefined) {
    throw new Error(
      "useUserSettingsModal must be used within a UserSettingsModalProvider"
    );
  }
  return context;
};
