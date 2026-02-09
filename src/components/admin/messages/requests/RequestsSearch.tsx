import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaSearch } from "react-icons/fa";
import { FaTrash } from "react-icons/fa6";

interface RequestsSearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedRequests: number[];
  onDeleteSelected: () => void;
}

const RequestsSearch = ({
  searchTerm,
  setSearchTerm,
  selectedRequests,
  onDeleteSelected,
}: RequestsSearchProps) => {
  const [showModal, setShowModal] = useState(false);
  const { t } = useTranslation();
  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  const handleDelete = () => {
    onDeleteSelected();
    closeModal();
  };

  return (
    <div className="flex items-center justify-between gap-5">
      <label className="input input-bordered input-ghost bg-base-100 input-md flex items-center gap-2">
        <input
          type="text"
          className="grow"
          placeholder={t("search")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label={t("aria.requestsSearch.searchInput")}
        />
        <FaSearch />
      </label>
      <div className="flex items-center gap-2">
        <button
          className="btn btn-sm btn-error"
          onClick={openModal}
          disabled={selectedRequests.length === 0}
          aria-label={t("aria.requestsSearch.deleteSelectedButton")}
        >
          <FaTrash />
          <span className="hidden md:block">{t("delete_selected")}</span>
        </button>
      </div>
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">
              {t("delete_request_confirmation")}
            </h3>
            <p className="py-4">{t("delete_request_prompt_selected")}</p>
            <p className="text-sm text-warning">
              {t("delete_request_warning")}
            </p>
            <div className="modal-action">
              <button
                className="btn"
                onClick={closeModal}
                aria-label={t("aria.requestsSearch.cancelButton")}
              >
                {t("cancel")}
              </button>
              <button
                className="btn btn-error"
                onClick={handleDelete}
                aria-label={t("aria.requestsSearch.confirmDeleteButton")}
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

export default RequestsSearch;
