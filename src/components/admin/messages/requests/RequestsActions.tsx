import React, { useState } from "react";
import { FaEllipsis, FaPen, FaTrash } from "react-icons/fa6";
import { deleteRequest } from "@/lib/server/actions"; // Import delete action
import { t } from "i18next";

const RequestsActions = ({
  requestId,
  onEditClick,
  onDeleteSuccess,
}: {
  requestId: string;
  onEditClick: () => void;
  onDeleteSuccess: () => void;
  setShowToast: (value: boolean) => void;
}) => {
  const [showModal, setShowModal] = useState(false);

  const handleDelete = async () => {
    if (!requestId) {
      console.error("Invalid requestId:", requestId);
      return;
    }
    try {
      await deleteRequest(requestId);
      setShowModal(false);
      onDeleteSuccess();
    } catch (error) {
      console.error("Failed to delete request:", error);
    }
  };

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  return (
    <>
      <div className="dropdown dropdown-bottom dropdown-end">
        <div
          tabIndex={0}
          role="button"
          className="btn"
          aria-label={t("aria.requestsActions.dropdownMenu")}
        >
          <FaEllipsis size={20} />
        </div>
        <ul
          tabIndex={0}
          className="dropdown-content menu bg-base-100 rounded-box z-[1] w-40 gap-2 p-2 shadow"
        >
          <li>
            <button
              className=""
              onClick={onEditClick}
              aria-label={t("aria.requestsActions.editButton")}
            >
              <FaPen /> {`${t("update")} ${t("customer")}`}
            </button>
          </li>
          <li>
            <button
              className=""
              onClick={openModal}
              aria-label={t("aria.requestsActions.deleteButton")}
            >
              <FaTrash /> {`${t("delete")} ${t("customer")}`}
            </button>
          </li>
        </ul>
      </div>
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">{t("delete_confirmation")}</h3>
            <p className="py-4">{t("delete_request_prompt")}</p>
            <div className="modal-action">
              <button className="btn" onClick={closeModal}>
                {t("cancel")}
              </button>
              <button className="btn btn-error" onClick={handleDelete}>
                {t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RequestsActions;
