"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { changeOwnPassword } from "@/lib/server/actions";

const ChangePassword = () => {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);
    let valid = true;
    const newErrors = {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    };

    if (!currentPassword) {
      newErrors.currentPassword = t("current_password_required");
      valid = false;
    }

    if (!newPassword) {
      newErrors.newPassword = t("new_password_required");
      valid = false;
    } else if (newPassword.length < 6) {
      newErrors.newPassword = t("password_too_short");
      valid = false;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = t("confirm_password_required");
      valid = false;
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = t("passwords_not_matching");
      valid = false;
    }

    setErrors(newErrors);

    if (valid) {
      setLoading(true);
      try {
        const result = await changeOwnPassword(currentPassword, newPassword);
        if (result.success) {
          setSuccess(true);
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          setTimeout(() => setSuccess(false), 3000);
        } else {
          setErrors({
            ...newErrors,
            currentPassword: result.message || t("password_change_failed"),
          });
        }
      } catch {
        setErrors({
          ...newErrors,
          currentPassword: t("password_change_failed"),
        });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-md">
      <h4 className="text-lg font-semibold">{t("change_password")}</h4>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-start gap-3 w-full max-w-md"
      >
        {success && (
          <div className="alert alert-success">
            <span>{t("password_changed_successfully")}</span>
          </div>
        )}

        <fieldset className="fieldset">
          <legend className="fieldset-legend">{t("current_password")}</legend>
          <input
            id="currentPassword"
            name="currentPassword"
            autoComplete="current-password"
            type="password"
            className="input"
            placeholder=""
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            aria-label={t("aria.current_password_input")}
          />
          {errors.currentPassword && (
            <span className="text-xs text-red-500">
              {errors.currentPassword}
            </span>
          )}
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">{t("new_password")}</legend>
          <input
            id="newPassword"
            name="newPassword"
            autoComplete="new-password"
            type="password"
            className="input"
            placeholder=""
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            aria-label={t("aria.new_password_input")}
          />
          {errors.newPassword && (
            <span className="text-xs text-red-500">{errors.newPassword}</span>
          )}
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">{t("confirm_password")}</legend>
          <input
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            type="password"
            className="input"
            placeholder=""
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            aria-label={t("aria.confirm_password_input")}
          />
          {errors.confirmPassword && (
            <span className="text-xs text-red-500">
              {errors.confirmPassword}
            </span>
          )}
        </fieldset>

        <button
          type="submit"
          className="btn btn-primary mt-2"
          disabled={loading}
          aria-label={
            loading ? t("aria.changing_password") : t("aria.change_password")
          }
        >
          {loading ? t("changing") : t("save")}
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;
