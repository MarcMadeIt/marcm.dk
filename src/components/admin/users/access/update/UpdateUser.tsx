import React, { useState, useEffect } from "react";
import { FaEnvelope, FaKey, FaShield, FaSignature } from "react-icons/fa6";
import { updateUser, getAllUsers } from "@/lib/server/actions";
import { useTranslation } from "react-i18next";

const UpdateUser = ({
  userId,
  onUserUpdated,
}: {
  userId: string;
  onUserUpdated: () => void;
}) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"editor" | "admin" | "developer">("editor");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const users = await getAllUsers();
        const user = users.find((user) => user.id === userId);
        if (user) {
          setEmail(user.email || "");
          setRole(user.role as "editor" | "admin" | "developer");
          setName(user.name || "");
        }
      } catch {
        console.error("Failed to fetch user data");
      }
    };

    fetchUserData();
  }, [userId]);

  const validateEmail = (email: string) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;
    const errors = { email: "", password: "", confirmPassword: "" };

    if (email && !validateEmail(email)) {
      errors.email = t("invalid_email");
      valid = false;
    }

    if (password && password.length < 6) {
      errors.password = t("password_too_short");
      valid = false;
    }

    if (password && password !== confirmPassword) {
      errors.confirmPassword = t("passwords_not_matching");
      valid = false;
    }

    setErrors(errors);

    if (valid) {
      setLoading(true);
      try {
        const updateData: {
          email?: string;
          password?: string;
          role?: "editor" | "admin" | "developer";
          name?: string;
        } = {};
        if (email) updateData.email = email;
        if (password) updateData.password = password;
        if (role) updateData.role = role;
        if (name) updateData.name = name;

        await updateUser(userId, updateData);
        onUserUpdated();
      } catch {
        setErrors({ ...errors, password: t("registration_error") });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <form
      onSubmit={handleUpdate}
      className="flex flex-col items-start gap-7 w-full max-w-sm p-3"
    >
      <span className="text-lg font-bold">{t("update_user")}</span>
      <label className="select" htmlFor="role">
        <select
          name="role"
          value={role}
          onChange={(e) =>
            setRole(e.target.value as "editor" | "admin" | "developer")
          }
          required
          aria-label={t("aria.select_access_level")}
        >
          <option disabled value="">
            {t("select_access_level")}
          </option>
          <option value="editor">{t("editor")}</option>
          <option value="admin">{t("admin")}</option>
          <option value="developer">{t("developer")}</option>
        </select>
      </label>
      <div className="flex flex-col gap-2 relative w-full">
        <label className="input" htmlFor="name">
          <FaSignature />
          <input
            id="name"
            autoComplete="name"
            name="name"
            type="text"
            placeholder={t("name")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            aria-label={t("aria.name_input")}
          />
        </label>
      </div>
      <div className="flex flex-col gap-2 relative w-full">
        <label className="input" htmlFor="email">
          <FaEnvelope />
          <input
            name="email"
            autoComplete="email"
            id="email"
            type="email"
            placeholder={t("email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-label={t("aria.email_input")}
          />
        </label>
        {errors.email && (
          <p className="text-red-500 text-xs absolute -bottom-5 left-1">
            {errors.email}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2 relative w-full">
        <label className="input" htmlFor="password">
          <FaKey />
          <input
            id="password"
            name="password"
            autoComplete="new-password"
            type="password"
            placeholder={t("password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-label={t("aria.password_input")}
          />
        </label>
        {errors.password && (
          <p className="text-red-500 text-xs absolute -bottom-5 left-1">
            {errors.password}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2 relative w-full">
        <label className="input" htmlFor="confirmPassword">
          <FaShield />
          <input
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            type="password"
            placeholder={t("confirm_password")}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            aria-label={t("aria.confirm_password_input")}
          />
        </label>
        {errors.confirmPassword && (
          <p className="text-red-500 text-xs absolute -bottom-5 left-1">
            {errors.confirmPassword}
          </p>
        )}
      </div>

      <button
        type="submit"
        className="btn btn-primary mt-2"
        disabled={loading}
        aria-label={
          loading ? t("aria.updating_button") : t("aria.update_button")
        }
      >
        {loading ? t("updating") : t("update")}
      </button>
    </form>
  );
};

export default UpdateUser;
