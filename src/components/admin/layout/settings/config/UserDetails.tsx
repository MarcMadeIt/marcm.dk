"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { readUserSession } from "@/lib/auth/readUserSession";

type UserDetailsProps = {
  onChangePassword?: () => void;
};

const UserDetails = ({ onChangePassword }: UserDetailsProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | undefined>();
  const [role, setRole] = useState<"admin" | "editor" | "developer" | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const roleLabel = () => {
    if (loading) return "…";
    if (!role) return "—";
    // Roles are translated in i18n locales
    return t(role);
  };

  useEffect(() => {
    let cancelled = false;
    const loadSession = async () => {
      try {
        const session = await readUserSession();
        if (cancelled) return;
        setName(session?.name ?? null);
        setEmail(session?.user.email);
        setRole(session?.role ?? null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadSession();
    return () => {
      cancelled = true;
    };
  }, []);
  return (
      <div className="flex flex-col gap-5 items-start">
        <div className="flex flex-col gap-1">
          <h5 className="text-sm font-medium text-gray-400">{t("name")}</h5>
          {loading ? (
            <div className="skeleton w-full h-4"></div>
          ) : (
            <p>{name ? name : "—"}</p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <h5 className="text-sm font-medium text-gray-400">{t("email")}</h5>
          {loading ? (
            <div className="skeleton w-full h-4"></div>
          ) : (
            <p>{email ? email : "—"}</p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <h5 className="text-sm font-medium text-gray-400">{t("access_level")}</h5>
          {loading ? (
            <div className="skeleton w-full h-4"></div>
          ) : (
            <p>{roleLabel()}</p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <h5 className="text-sm font-medium text-gray-400">{t("password")}</h5>
          <button className="btn btn-sm btn-soft" onClick={onChangePassword}>
            {t("change_password")}
          </button>
        </div>
      </div>
    
  );
};

export default UserDetails;
