import React, { useEffect, useState } from "react";
import RequestsSearch from "./RequestsSearch";
import RequestsList, { Request } from "./RequestsList";
import RequestsDetails from "./RequestsDetails";
import { FaAngleLeft } from "react-icons/fa6";
import {
  deleteRequest,
  updateRequest,
  getRequestById,
} from "@/lib/server/actions";
import RequestsPagination from "./RequestsPagination";

import { useTranslation } from "react-i18next";
import { useRouter, useSearchParams } from "next/navigation";
import { useNotifications } from "@/hooks/useNotifications";

const Requests = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { markAsReadByRequestId } = useNotifications();
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null
  );
  const [requests, setRequests] = useState<Request[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequests, setSelectedRequests] = useState<number[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [selectedRequestData, setSelectedRequestData] =
    useState<Request | null>(null);
  const { t } = useTranslation();

  const isUuid = (value: string) => /^[0-9a-fA-F-]{36}$/.test(value);

  const handleDetailsClick = (requestId: number | string) => {
    const idStr = String(requestId);
    const request = requests.find((r) => String(r.id) === idStr);
    if (request) {
      setSelectedRequestId(idStr);
      setSelectedRequestData(request);
      // Mark notification as read when viewing request
      if (isUuid(idStr)) {
        markAsReadByRequestId(idStr);
      }
      // Sync URL so back/refresh keeps the same view
      if (isUuid(idStr) && searchParams.get("requestId") !== idStr) {
        router.push(`/admin/messages?requestId=${idStr}`);
      }
    } else {
      // If request is not in list, fetch it
      const fetchRequest = async () => {
        try {
          if (!isUuid(idStr)) return;
          const requestData = await getRequestById(idStr);
          if (requestData) {
            setSelectedRequestId(idStr);
            setSelectedRequestData(requestData as Request);
            // Optionally add to requests list
            setRequests((prev) => {
              if (!prev.some((r) => String(r.id) === idStr)) {
                return [requestData as Request, ...prev];
              }
              return prev;
            });
            // Mark notification as read when viewing request
            markAsReadByRequestId(idStr);
            if (isUuid(idStr) && searchParams.get("requestId") !== idStr) {
              router.push(`/admin/messages?requestId=${idStr}`);
            }
          }
        } catch (error) {
          console.error("Failed to fetch request by ID:", error);
        }
      };
      fetchRequest();
    }
  };

  const handleBackClick = () => {
    setSelectedRequestId(null);
    setSelectedRequestData(null);
    setIsEditing(false);
    router.push("/admin/messages");
  };

  const handleDeleteSelected = async () => {
    try {
      const deletedCount = selectedRequests.length;
      
      setRequests((prevRequests) =>
        prevRequests.filter((request) => !selectedRequests.includes(request.id))
      );
      setSelectedRequests([]);
      
      // Opdater total og tjek om vi skal gå til forrige side
      setTotal((prevTotal) => {
        const newTotal = Math.max(0, prevTotal - deletedCount);
        const totalPages = Math.ceil(newTotal / 6);
        
        // Hvis nuværende side er højere end antal sider, gå til sidste side (eller side 1)
        if (page > totalPages && totalPages > 0) {
          setPage(totalPages);
        } else if (newTotal === 0) {
          setPage(1);
        }
        
        return newTotal;
      });
      
      await Promise.all(
        selectedRequests.map((id) => deleteRequest(id.toString()))
      );
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error("Failed to delete selected requests:", error);
    }
  };

  const handleCheckboxChange = (requestId: number) => {
    setSelectedRequests((prevSelected) =>
      prevSelected.includes(requestId)
        ? prevSelected.filter((id) => id !== requestId)
        : [...prevSelected, requestId]
    );
  };

  const handleDeleteRequest = (deletedRequestId: number) => {
    setRequests((prevRequests) =>
      prevRequests.filter((request) => request.id !== deletedRequestId)
    );
    
    // Opdater total og tjek om vi skal gå til forrige side
    setTotal((prevTotal) => {
      const newTotal = Math.max(0, prevTotal - 1);
      const totalPages = Math.ceil(newTotal / 6);
      
      // Hvis nuværende side er højere end antal sider, gå til sidste side (eller side 1)
      if (page > totalPages && totalPages > 0) {
        setPage(totalPages);
      } else if (newTotal === 0) {
        setPage(1);
      }
      
      return newTotal;
    });
    
    setSelectedRequestId(null); // Redirect to list view
    setSelectedRequestData(null);
    setShowToast(true); // Trigger toast
    setTimeout(() => setShowToast(false), 3000);
  };

  // When a requestId is present in URL, show its details (guard against loops/invalid ids)
  useEffect(() => {
    const param = searchParams.get("requestId");
    // Bail if missing or not UUID-ish (avoid db errors on numeric/short ids)
    if (!param || !isUuid(param)) {
      setSelectedRequestId(null);
      setSelectedRequestData(null);
      return;
    }

    // Already showing this request
    if (selectedRequestId === param) return;

    const existing = requests.find((r) => String(r.id) === param);
    if (existing) {
      setSelectedRequestId(param);
      setSelectedRequestData(existing);
      // Mark notification as read when viewing request
      markAsReadByRequestId(param);
      return;
    }

    const fetchRequest = async () => {
      try {
        const requestData = await getRequestById(param);
        if (requestData) {
          setSelectedRequestId(param);
          setSelectedRequestData(requestData as Request);
          setRequests((prev) => {
            if (!prev.some((r) => String(r.id) === param)) {
              return [requestData as Request, ...prev];
            }
            return prev;
          });
          // Mark notification as read when viewing request
          markAsReadByRequestId(param);
        }
      } catch (error) {
        console.error("Failed to fetch request by ID:", error);
      }
    };
    fetchRequest();
  }, [searchParams, selectedRequestId, requests, markAsReadByRequestId]);

  const handleUpdateRequest = async (
    requestId: string,
    data: Partial<Request>
  ) => {
    try {
      setRequests((prevRequests) =>
        prevRequests.map((request) =>
          request.id === parseInt(requestId) ? { ...request, ...data } : request
        )
      );
      // Update selectedRequestData if it matches
      if (
        selectedRequestData &&
        selectedRequestData.id === parseInt(requestId)
      ) {
        setSelectedRequestData({ ...selectedRequestData, ...data });
      }
      await updateRequest(requestId, data);
    } catch (error) {
      console.error("Failed to update request:", error);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {selectedRequestId ? (
        <div className="flex flex-col items-start gap-5">
          {!isEditing && (
            <div className="flex items-start gap-5">
              <button
                onClick={handleBackClick}
                className="btn btn-ghost"
                aria-label={t("aria.requests.backButton")}
              >
                <FaAngleLeft />
                {t("back")}
              </button>
            </div>
          )}
          {selectedRequestData && (
            <RequestsDetails
              name={selectedRequestData.name || ""}
              company={selectedRequestData.company || ""}
              category={selectedRequestData.category || ""}
              created_at={selectedRequestData.created_at || ""}
              mobile={selectedRequestData.mobile || ""}
              mail={selectedRequestData.mail || ""}
              city={selectedRequestData.city || ""}
              address={selectedRequestData.address || ""}
              message={selectedRequestData.message || ""}
              consent={!!selectedRequestData.consent}
              requestId={selectedRequestId.toString()}
              setIsEditing={setIsEditing}
              onUpdateRequest={handleUpdateRequest}
              onDeleteRequest={(deletedRequestId) => {
                handleDeleteRequest(deletedRequestId);
              }}
            />
          )}
        </div>
      ) : (
        <>
          <RequestsSearch
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedRequests={selectedRequests}
            onDeleteSelected={handleDeleteSelected}
            aria-label={t("aria.requests.searchInput")}
          />
          <RequestsList
            requests={requests}
            setRequests={setRequests}
            page={page}
            setPage={setPage}
            total={total}
            setTotal={setTotal}
            searchTerm={searchTerm}
            onDetailsClick={handleDetailsClick}
            selectedRequests={selectedRequests}
            setSelectedRequests={setSelectedRequests}
            handleCheckboxChange={handleCheckboxChange}
          />
          <RequestsPagination page={page} setPage={setPage} total={total} />
        </>
      )}
      {showToast && (
        <div className="toast bottom-20 md:bottom-0 toast-end">
          <div className="alert alert-success text-neutral-content">
            <span className="text-base md:text-lg">{t("deleted_request")}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Requests;
