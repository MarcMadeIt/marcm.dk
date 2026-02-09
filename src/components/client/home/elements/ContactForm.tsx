"use client";

import React, { useState, FormEvent } from "react";
import { createRequest } from "@/lib/server/client-actions";
import { useTranslation } from "react-i18next";
import ConsentModal from "./ConsentModal";
import { FaCheckCircle } from "react-icons/fa";
import { FaPaperPlane } from "react-icons/fa6";

const ContactForm = () => {
  const { t, i18n } = useTranslation();

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [mail, setMail] = useState("");
  const [message, setMessage] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [hasTyped, setHasTyped] = useState(false);
  const charLimit = 200;
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const validatePhoneNumber = (phoneNumber: string) => {
    const danishPhoneRegex = /^(?:\+45\d{8}|\d{8})$/;
    return danishPhoneRegex.test(phoneNumber);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorText("");
    setSuccessText("");

    // Validering af felter
    if (!name || !mail || !mobile || !message) {
      setErrorText("Alle felter skal udfyldes.");
      return;
    }

    if (!validatePhoneNumber(mobile)) {
      setErrorText(t("contactForm.errors.invalidPhone"));
      return;
    }
    if (!isChecked) {
      setErrorText(t("contactForm.errors.consentRequired"));
      return;
    }

    setIsLoading(true);

    try {
      await createRequest(name, mobile, mail, isChecked, message);

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email: mail,
          phone: mobile,
          message,
          lang: i18n.language,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Email send failed");
      }

      setIsSuccess(true);
      setSuccessText("Din besked er sendt!");
    } catch (err: unknown) {
      console.error("Submit error:", err);
      if (err instanceof Error) {
        setErrorText(err.message);
      } else {
        setErrorText("Der opstod en fejl. Prøv igen senere.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= charLimit) {
      setMessage(val);
      setCharCount(val.length);
      if (!hasTyped) setHasTyped(true);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setSuccessText("");
    setErrorText("");
    setName("");
    setMail("");
    setMobile("");
    setMessage("");
    setIsChecked(false);
  };

  return (
    <div className="w-full max-w-xl min-w-0 overflow-hidden">
      {isSuccess ? (
        <div className="flex flex-col gap-6 bg-base-100 rounded-2xl p-6 sm:p-8 md:p-10 lg:p-12 min-h-[400px] justify-center items-center text-center">
          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-4">
            <FaCheckCircle className="h-6 w-6 text-success" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold px-2">
            {t("contactForm.success.title")}
          </h2>
          <p className="text-base-content/70 text-sm sm:text-base px-2">
            {t("contactForm.success.message")}
          </p>
          <button onClick={handleClose} className="btn btn-primary mt-4">
            {t("contactForm.success.closeButton")}
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6 bg-base-100 rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 lg:p-10 border border-base-300 w-full min-w-0"
        >
          <div className="min-w-0">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              {t("contactForm.title")}
            </h2>
            <p className="text-xs sm:text-sm text-base-content/60">
              {t(
                "contactForm.subtitle",
                "Fyld formularen ud, så vender jeg tilbage hurtigst muligt",
              )}
            </p>
          </div>

          <div className="flex flex-col gap-4 min-w-0">
            <div className="form-control min-w-0">
              <label className="label">
                <span className="label-text font-medium text-primary mb-1">
                  {t("contactForm.fields.name.label")}
                </span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder={t("contactForm.fields.name.placeholder")}
                aria-label={t("contactForm.aria.nameInput")}
                className="input input-bordered w-full focus:input-primary transition-colors min-w-0"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-control min-w-0">
              <label className="label">
                <span className="label-text font-medium text-primary mb-1">
                  {t("contactForm.fields.email.label")}
                </span>
              </label>
              <input
                id="mail"
                name="mail"
                type="email"
                autoComplete="email"
                placeholder={t("contactForm.fields.email.placeholder")}
                aria-label={t("contactForm.aria.emailInput")}
                className="input input-bordered w-full focus:input-primary transition-colors min-w-0"
                value={mail}
                onChange={(e) => setMail(e.target.value)}
                required
              />
            </div>

            <div className="form-control min-w-0">
              <label className="label">
                <span className="label-text font-medium text-primary mb-1">
                  {t("contactForm.fields.message.label")}
                </span>
              </label>
              <div className="relative min-w-0">
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  placeholder={t("contactForm.fields.message.placeholder")}
                  aria-label={t("contactForm.aria.messageInput")}
                  className="textarea textarea-bordered w-full resize-none focus:textarea-primary transition-colors min-w-0"
                  value={message}
                  onChange={handleMessageChange}
                  maxLength={charLimit}
                  required
                />
                {hasTyped && (
                  <div className="absolute bottom-2 right-2 text-xs text-base-content/50 bg-base-100 px-2 py-1 rounded">
                    {charCount}/{charLimit}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="form-control min-w-0">
            <label className="label cursor-pointer justify-start gap-3 min-w-0">
              <input
                id="consent"
                type="checkbox"
                className="checkbox checkbox-primary shrink-0"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                aria-label={t("contactForm.aria.consentCheckbox")}
                required
              />
              <div className="min-w-0 flex-1">
                <span className="label-text text-xs sm:text-sm">
                  {t("contactForm.fields.consent.label")}{" "}
                  <ConsentModal
                    buttonText={t("contactForm.fields.consent.readMore")}
                    variant="primary"
                  />
                </span>
              </div>
            </label>
          </div>
          <div className="min-w-0">
            <button
              type="submit"
              className="btn btn-secondary mt-2 font-semibold"
              disabled={isLoading}
              aria-label={t("contactForm.aria.submitButton")}
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner"></span>
                  {t("contactForm.buttons.sending")}
                </>
              ) : (
                <>
                  <FaPaperPlane />
                  {t("contactForm.buttons.submit")}
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ContactForm;
