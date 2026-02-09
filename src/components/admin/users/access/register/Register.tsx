import { createMember } from "@/lib/server/actions";
import React, { useState } from "react";
import { FaEnvelope, FaKey, FaShield, FaSignature } from "react-icons/fa6";
import { useTranslation } from "react-i18next";

const Register = ({ onUserCreated }: { onUserCreated: () => void }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"editor" | "admin" | "developer" | "">("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
  });
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;
    const errors = { email: "", password: "", confirmPassword: "", role: "" };

    if (!validateEmail(email)) {
      errors.email = t("invalid_email");
      valid = false;
    }

    if (password.length < 6) {
      errors.password = t("password_too_short");
      valid = false;
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = t("passwords_not_matching");
      valid = false;
    }

    if (role === "") {
      errors.role = t("select_access_level");
      valid = false;
    }

    setErrors(errors);

    if (valid) {
      setLoading(true);
      try {
        await createMember({
          email,
          password,
          role: role as "editor" | "admin" | "developer",
          name,
        });
        onUserCreated();
      } catch (err: unknown) {
        const errorCode =
          err instanceof Error ? err.message : "REGISTRATION_ERROR";

        if (errorCode === "EMAIL_ALREADY_EXISTS") {
          setErrors({ ...errors, email: t("messages.email_already_exists") });
        } else {
          setErrors({ ...errors, password: t("messages.registration_error") });
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <form
      onSubmit={handleRegister}
      className="flex flex-col items-start gap-7 w-full max-w-sm p-3"
    >
      <span className="text-lg font-bold">{t("create_new_user")}</span>
      <label className="select" htmlFor="role">
        <select
          name="role"
          value={role}
          onChange={(e) =>
            setRole(e.target.value as "editor" | "admin" | "developer" | "")
          }
          required
        >
          <option disabled value="">
            {t("select_access_level")}
          </option>
          <option value="editor">{t("editor")}</option>
          <option value="admin">{t("admin")}</option>
          <option value="developer">{t("developer")}</option>
        </select>
        {errors.role && (
          <p className="text-red-500 text-xs absolute -bottom-5 left-1">
            {errors.role}
          </p>
        )}
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
            aria-label={t("aria.register.nameInput")}
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
            aria-label={t("aria.register.emailInput")}
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
            required
            aria-label={t("aria.register.passwordInput")}
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
            required
          />
        </label>
        {errors.confirmPassword && (
          <p className="text-red-500 text-xs absolute -bottom-5 left-1">
            {errors.confirmPassword}
          </p>
        )}
      </div>

      <button type="submit" className="btn btn-primary mt-2" disabled={loading}>
        {loading ? t("creating_user") : t("create_user")}
      </button>
    </form>
  );
};

export default Register;
