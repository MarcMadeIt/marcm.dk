import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FaAngleRight } from "react-icons/fa6";
import { getAllRequests } from "@/lib/server/actions";
import {
  useRequestsRealtime,
  type RealtimeRequest,
} from "@/hooks/useRequestsRealtime";
import Image from "next/image";

export interface Request {
  id: number;
  name: string;
  company: string;
  category: string;
  created_at: string;
  mobile: string;
  mail: string;
  message: string;
  address: string;
  city: string;
  consent: boolean;
}

interface RequestsListProps {
  requests: Request[];
  setRequests: React.Dispatch<React.SetStateAction<Request[]>>;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  total: number;
  setTotal: React.Dispatch<React.SetStateAction<number>>;
  searchTerm: string;
  onDetailsClick: (requestId: number) => void;
  selectedRequests: number[];
  setSelectedRequests: React.Dispatch<React.SetStateAction<number[]>>;
  handleCheckboxChange: (requestId: number) => void;
}

const RequestsList = ({
  requests,
  setRequests,
  page,
  setTotal,
  searchTerm,
  onDetailsClick,
  selectedRequests,
  setSelectedRequests,
  handleCheckboxChange,
}: RequestsListProps) => {
  const [loading, setLoading] = useState(true);
  const [localRequests, setLocalRequests] = useState<Request[]>(requests);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const safeSelectedRequests = Array.isArray(selectedRequests)
    ? selectedRequests
    : [];
  const { t } = useTranslation();

  useEffect(() => {
    const checkTheme = () => {
      const theme = document.documentElement.getAttribute("data-theme");
      setIsDarkTheme(theme !== "arzoniclight");
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  const handleNewRequest = useCallback(
    (payload: RealtimeRequest) => {
      if (!payload?.id) return;

      const numericId =
        typeof payload.id === "number"
          ? payload.id
          : parseInt(String(payload.id), 10);

      if (Number.isNaN(numericId)) return;

      setTotal((prevTotal) => prevTotal + 1);

      if (page !== 1) return;

      setRequests((prevRequests) => {
        if (prevRequests.some((req) => req.id === numericId)) {
          return prevRequests;
        }
        const nextRequest: Request = {
          id: numericId,
          name: payload.name ?? "",
          company: payload.company ?? "",
          category: payload.category ?? "",
          created_at: payload.created_at ?? new Date().toISOString(),
          mobile: payload.mobile ?? "",
          mail: payload.mail ?? "",
          message: payload.message ?? "",
          address: payload.address ?? "",
          city: payload.city ?? "",
          consent: payload.consent ?? false,
        };
        return [nextRequest, ...prevRequests].slice(0, 6);
      });
    },
    [page, setRequests, setTotal]
  );

  useRequestsRealtime(handleNewRequest);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const { requests, total } = await getAllRequests(page, 6); // Fetch 6 requests per page
        setRequests(requests); // Update the requests state
        setTotal(total); // Update the total count for pagination
      } catch (error) {
        console.error("Failed to fetch requests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [page, setRequests, setTotal]); // Refetch when the page changes

  useEffect(() => {
    setLocalRequests(
      requests.filter((request) => {
        const searchTermLower = searchTerm.toLowerCase();
        return (
          request.name?.toLowerCase().includes(searchTermLower) ||
          request.category?.toLowerCase().includes(searchTermLower) ||
          request.mobile?.toString().includes(searchTerm) ||
          request.address?.toLowerCase().includes(searchTermLower) ||
          request.city?.toLowerCase().includes(searchTermLower) ||
          request.mail?.toLowerCase().includes(searchTermLower)
        );
      })
    );
  }, [requests, searchTerm]);

  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table className="table md:table-md lg:table-lg">
          <thead>
            <tr>
              <th>
                <label>
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={false}
                    disabled
                    aria-hidden="true"
                  />
                </label>
              </th>
              <th>{t("sent_by")}</th>
              <th className="hidden md:block">{t("subject")}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, index) => (
              <tr key={`request-skeleton-${index}`}>
                <th>
                  <div className="skeleton h-5 w-5 rounded-md" />
                </th>
                <td>
                  <div className="skeleton h-4 w-32 md:w-40" />
                </td>
                <td className="hidden md:block">
                  <div className="flex flex-col gap-2">
                    <div className="skeleton h-4 w-28" />
                    <div className="skeleton h-4 w-20 rounded-full" />
                  </div>
                </td>
                <th>
                  <div className="skeleton h-8 w-20 md:w-24" />
                </th>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!localRequests.length) {
    return (
      <div className="h-96 flex flex-col items-center justify-center">
        <Image 
          src={isDarkTheme ? "/empty-dark.png" : "/empty-light.png"} 
          alt="No requests" 
          width={300} 
          height={300} 
          className="w-32 md:w-42 h-auto mb-4"
        />
        <span className="text-base md:text-lg font-semibold text-base-content/90 text-center">{t("no_requests")}</span>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="table md:table-md lg:table-lg">
        <thead>
          <tr>
            <th>
              <label>
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  onChange={(e) =>
                    setSelectedRequests(
                      e.target.checked ? localRequests.map((req) => req.id) : []
                    )
                  }
                  checked={
                    localRequests.length > 0 &&
                    safeSelectedRequests.length === localRequests.length
                  }
                  aria-label={t("aria.requestsList.selectAllCheckbox")}
                />
              </label>
            </th>
            <th>{t("sent_by")}</th>
            <th className="hidden md:block">{t("subject")}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {localRequests.map((request) => (
            <tr key={request.id}>
              <th>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary "
                    checked={safeSelectedRequests.includes(request.id)}
                    onChange={() => handleCheckboxChange(request.id)}
                    aria-label={t("aria.requestsList.individualCheckbox")}
                  />
                </label>
              </th>
              <td
                onClick={() => onDetailsClick(request.id)}
                className="cursor-pointer w-full md:w-auto"
              >
                <div className="flex items-center gap-1 text-xs md:text-sm font-bold ">
                  <div>{request.company || request.name}</div>
                </div>
              </td>
              <td
                className="hidden md:block cursor-pointer "
                onClick={() => onDetailsClick(request.id)}
              >
                <span className="pl-2 font-bold text-xs md:text-sm">
                  {request.category}
                </span>
                <br />
                <span className="badge badge-sm lg:text-[11px] text-[10px]  ">
                  {request.created_at
                    ? new Date(request.created_at).toLocaleDateString("da-DK")
                    : "Ugyldig dato"}
                </span>
              </td>
              <th className="">
                <button
                  className="btn btn-outline btn-primary btn-sm flex items-center"
                  onClick={() => onDetailsClick(request.id)}
                  aria-label={t("aria.requestsList.detailsButton")}
                >
                  <span className="hidden lg:block">{t("details")}</span>
                  <FaAngleRight />
                </button>
              </th>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RequestsList;
