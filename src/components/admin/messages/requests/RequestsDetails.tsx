import React, { useState, useEffect } from "react";
import { format, differenceInDays, addDays } from "date-fns";

import {
  FaCircleCheck,
  FaCircleXmark,
  FaLocationArrow,
  FaPhoneVolume,
} from "react-icons/fa6";
import RequestsActions from "./RequestsActions";
import UpdateRequest from "./updateRequest/UpdateRequest";
import { Request } from "./RequestsList";
import { useTranslation } from "react-i18next";
import RequestNote from "./createNote/RequestNote";

interface RequestsDetailsProps {
  name: string;
  company: string;
  category: string;
  created_at: string;
  mobile: string;
  mail: string;
  address: string;
  city: string;
  message: string;
  consent: boolean;
  requestId: string;
  setIsEditing: (isEditing: boolean) => void;
  onUpdateRequest: (requestId: string, data: Partial<Request>) => void;
  onDeleteRequest: (deletedRequestId: number) => void;
}

const RequestsDetails = ({
  name,
  company,
  category,
  created_at,
  mobile,
  mail,
  address,
  city,
  message,
  consent,
  requestId,
  setIsEditing,
  onUpdateRequest,
  onDeleteRequest,
}: RequestsDetailsProps) => {
  const { t } = useTranslation();
  const [isEditing, setLocalIsEditing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [requestDetails, setRequestDetails] = useState({
    name,
    company,
    category,
    mobile,
    message,
    mail,
    address,
    city,
  });

  useEffect(() => {
    console.log("Request details message:", requestDetails.message);
  }, [requestDetails]);

  const handleUpdateRequest = (requestId: string, data: Partial<Request>) => {
    setRequestDetails((prevDetails) => ({ ...prevDetails, ...data }));
    onUpdateRequest(requestId, data);

    setShowToast(true);
  };

  const handleDeleteSuccess = () => {
    onDeleteRequest(parseInt(requestId)); // Notify parent about deletion
    setIsEditing(false); // Ensure editing state is reset
  };

  const endDate = created_at ? addDays(new Date(created_at), 30) : null;
  const daysLeft = endDate ? differenceInDays(endDate, new Date()) : null;

  const handleEditClick = () => {
    setLocalIsEditing(true);
    setIsEditing(true);
  };

  const handleBackClick = () => {
    setLocalIsEditing(false);
    setIsEditing(false);
  };

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  if (isEditing) {
    return (
      <UpdateRequest
        requestId={requestId}
        onBackClick={handleBackClick}
        setShowToast={setShowToast}
        onUpdateRequest={handleUpdateRequest}
      />
    );
  }

  return (
    <div className="flex flex-col gap-10 w-full p-3 ">
      <h2 className="text-lg font-bold">{t("request_details")}</h2>{" "}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-5">
          <a
            href={`tel:+45${mobile}`}
            className={`btn btn-primary btn-sm sm:btn-md flex items-center gap-2 ${
              !mobile ? "btn-disabled" : ""
            }`}
            aria-label={t("aria.requestsDetails.phoneLink")}
          >
            <FaPhoneVolume /> {t("contact_customer")}
          </a>

          <div
            className="tooltip tooltip-bottom"
            data-tip={!requestDetails.address ? t("no_address") : undefined}
          >
            <a
              href={`https://www.google.com/maps?q=${encodeURIComponent(
                requestDetails.address
              )}%20${encodeURIComponent(requestDetails.city)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-lg font-semibold btn btn-sm sm:btn-md btn-neutral ${
                !requestDetails.address ? "btn-disabled" : ""
              }`}
              aria-label={t("aria.requestsDetails.mapLink")}
            >
              <span className="hidden md:block">{t("show_route")}</span>
              <FaLocationArrow />
            </a>
          </div>
        </div>
        <RequestsActions
          requestId={requestId}
          onEditClick={handleEditClick}
          onDeleteSuccess={() => {
            handleDeleteSuccess();
            setLocalIsEditing(false);
          }}
          setShowToast={() => {}}
        />
      </div>
      <div className="flex flex-col gap-10">
        <div className="flex flex-col md:flex-row gap-10 md:gap-0">
          <div className="flex flex-col gap-2 w-full md:w-1/2 2xl:w-1/3">
            <span className="text-sm font-medium text-gray-400">
              {t("days_left")}
            </span>
            <span
              className={`text-lg font-bold ${
                daysLeft !== null
                  ? daysLeft > 20
                    ? ""
                    : daysLeft > 10
                    ? "text-warning"
                    : daysLeft > 0
                    ? "text-error"
                    : "text-gray-500"
                  : "text-gray-500"
              }`}
            >
              {daysLeft !== null
                ? daysLeft > 0
                  ? `${daysLeft} ${t("days_left").toLowerCase()}`
                  : t("time_expired")
                : t("invalid_days")}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-400">
              {t("request_time")}
            </span>
            <span className="text-lg font-semibold">
              {created_at
                ? format(new Date(created_at), "d. MMMM yyyy 'kl.' HH:mm")
                : t("invalid_date")}
            </span>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-10 md:gap-0">
          <div className="flex flex-col gap-2 w-full md:w-1/2 2xl:w-1/3">
            <p className="text-sm font-medium text-gray-400">
              {t("company_name")}
            </p>
            <span className="text-lg font-semibold">
              {requestDetails.company || t("unknown")}
            </span>
          </div>
          <div className="flex flex-col gap-2 w-full md:w-1/2 2xl:w-1/3">
            <p className="text-sm font-medium text-gray-400">
              {t("contact_person")}
            </p>
            <span className="text-lg font-semibold">
              {requestDetails.name || t("unknown")}
            </span>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-10 md:gap-0">
          <div className="flex flex-col gap-2 w-full md:w-1/2 2xl:w-1/3">
            <p className="text-sm font-medium text-gray-400">{t("mobile")}</p>
            <span className="text-lg font-semibold">
              {requestDetails.mobile || t("unknown")}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-gray-400">{t("email")}</p>
            <span className="text-lg font-semibold">
              {requestDetails.mail || t("unknown")}
            </span>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-10 md:gap-0">
          <div className="flex flex-col gap-2 md:w-1/2 2xl:w-1/3">
            <p className="text-sm font-medium text-gray-400">
              {t("address_and_city")}
            </p>
            <span className="text-lg font-semibold">
              {requestDetails.address || t("unknown")},{" "}
              {requestDetails.city || t("unknown")}
            </span>
          </div>
          <div className="flex flex-col gap-2 ">
            <p className="text-sm font-medium text-gray-400">
              {t("task_interest")}
            </p>
            <span className="text-lg font-semibold">
              {requestDetails.category || t("unknown")}
            </span>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-10 md:gap-0">
          <div className="flex flex-col gap-2 w-full md:w-1/2 2xl:w-1/3">
            <p className="text-sm font-medium text-gray-400">
              {t("consent_status")}
            </p>
            <div>
              {consent ? (
                <span className="text-lg font-semibold text-success flex items-center gap-2">
                  <FaCircleCheck /> {t("consent_given")}
                </span>
              ) : (
                <span className="text-lg font-semibold text-error flex items-center gap-2">
                  <FaCircleXmark /> {t("consent_missing")}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 md:w-1/2">
            <p className="text-sm font-medium text-gray-400">{t("message")}</p>
            <div className="max-h-32 overflow-y-auto flex flex-col gap-5 width-full">
              <span className="text-base font-semibold">
                {requestDetails.message || t("no_message")}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div>
        <RequestNote requestId={requestId} />
      </div>
      {showToast && (
        <div className="toast bottom-20 md:bottom-0 toast-end">
          <div className="alert alert-success text-neutral-content">
            <span>{t("customer_details_updated")}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestsDetails;
