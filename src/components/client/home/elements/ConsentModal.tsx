"use client";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

interface ConsentModalProps {
  buttonText: string;
  variant?: "primary" | "hover";
}

const ConsentModal = ({ buttonText, variant = "hover" }: ConsentModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      {/* Link to open modal */}
      <span
        className={`link ${
          variant === "primary" ? "link-primary" : "link-hover"
        }`}
        onClick={() => setIsOpen(true)}
      >
        {buttonText}
      </span>

      {/* Modal */}
      {isOpen && (
        <div className="modal modal-open fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="modal-box max-w-2xl p-6 bg-base-100 rounded-lg shadow-lg">
            <h3 className="font-bold text-xl md:text-2xl py-2">
              {t("ConsentModal.title")}
            </h3>

            <div className="py-4 text-sm max-h-96 overflow-y-auto flex flex-col gap-5">
              <div>
                <h4 className="font-semibold md:text-base mb-2">
                  {t("ConsentModal.section1.title")}
                </h4>
                <p>{t("ConsentModal.section1.description")}</p>
                <ul className="list-disc pl-5 my-2">
                  <li>{t("ConsentModal.section1.list.name")}</li>
                  <li>{t("ConsentModal.section1.list.phone")}</li>
                  <li>{t("ConsentModal.section1.list.email")}</li>
                  <li>{t("ConsentModal.section1.list.details")}</li>
                </ul>
                <p>{t("ConsentModal.section1.note")}</p>
              </div>

              <div>
                <h4 className="font-semibold md:text-base mb-2">
                  {t("ConsentModal.section2.title")}
                </h4>
                <p>{t("ConsentModal.section2.description")}</p>

                <p className="mt-2">{t("ConsentModal.section2.info")}</p>
                <br />
                <p>
                  {t("ConsentModal.section2.note")}{" "}
                  <strong>
                    <a href="mailto:mail@arzonic.com" target="_blank">
                      mail@arzonic.com
                    </a>
                  </strong>
                  .
                </p>
              </div>

              <div>
                <h4 className="font-semibold md:text-base mb-2">
                  {t("ConsentModal.section3.title")}
                </h4>
                <p>{t("ConsentModal.section3.description")}</p>
              </div>

              <div>
                <h4 className="font-semibold md:text-base mb-2">
                  {t("ConsentModal.section4.title")}
                </h4>
                <p>{t("ConsentModal.section4.description")}</p>
                <ul className="list-disc pl-5 my-2">
                  <li>{t("ConsentModal.section4.list.access")}</li>
                  <li>{t("ConsentModal.section4.list.correct")}</li>
                  <li>{t("ConsentModal.section4.list.delete")}</li>
                  <li>{t("ConsentModal.section4.list.withdraw")}</li>
                </ul>
                <p>
                  {t("ConsentModal.section4.note")}{" "}
                  <strong>
                    <a href="mailto:mail@arzonic.com" target="_blank">
                      mail@arzonic.com
                    </a>
                  </strong>
                  .
                </p>
              </div>

              <div>
                <h4 className="font-semibold md:text-base mb-2">
                  {t("ConsentModal.section5.title")}
                </h4>
                <p>{t("ConsentModal.section5.description1")}</p>
                <p>{t("ConsentModal.section5.description2")}</p>
              </div>

              <div>
                <h4 className="font-semibold md:text-base mb-2">
                  {t("ConsentModal.section6.title")}
                </h4>
                <p>{t("ConsentModal.section6.description")}</p>
              </div>

              <div>
                <h4 className="font-semibold md:text-base mb-2">
                  {t("ConsentModal.section7.title")}
                </h4>
                <p>{t("ConsentModal.section7.description")}</p>
              </div>

              <p className="mt-2 text-xs">{t("ConsentModal.lastUpdated")}</p>
            </div>

            <div className="modal-action">
              <button
                className="btn btn-primary"
                onClick={() => setIsOpen(false)}
              >
                {t("ConsentModal.closeButton")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ConsentModal;
