"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FaDesktop,
  FaMobileAlt,
  FaTabletAlt,
  FaTrash,
  FaCheck,
  FaSync,
} from "react-icons/fa";
import { FaSpinner } from "react-icons/fa6";
import {
  getActiveSessions,
  revokeSession,
  revokeAllOtherSessions,
} from "@/lib/server/actions";

type Session = {
  id: string;
  user_agent: string | null;
  ip: string | null;
  created_at: string;
  updated_at: string | null;
  not_after: string | null;
  is_current: boolean;
};

const parseUserAgent = (
  userAgent: string | null,
  t: (key: string) => string,
) => {
  if (!userAgent)
    return {
      device: t("security.unknown"),
      browser: t("security.unknown"),
      os: t("security.unknown"),
    };

  let device = "Desktop";
  let browser = t("security.unknown");
  let os = t("security.unknown");

  // Detect device type
  if (/mobile/i.test(userAgent)) {
    device = "Mobil";
  } else if (/tablet|ipad/i.test(userAgent)) {
    device = "Tablet";
  }

  // Detect browser (rækkefølge er vigtig!)
  // Mere specifikke browsere skal tjekkes først
  if (
    /edg\//i.test(userAgent) ||
    /edga\//i.test(userAgent) ||
    /edgios\//i.test(userAgent)
  ) {
    browser = "Microsoft Edge";
  } else if (/opr\//i.test(userAgent) || /opera/i.test(userAgent)) {
    browser = "Opera";
  } else if (
    /brave\//i.test(userAgent) ||
    (userAgent.includes("Chrome") && userAgent.includes("Brave"))
  ) {
    browser = "Brave";
  } else if (/vivaldi\//i.test(userAgent)) {
    browser = "Vivaldi";
  } else if (/arc\//i.test(userAgent) || userAgent.includes("Arc/")) {
    browser = "Arc";
  } else if (/duckduckgo\//i.test(userAgent)) {
    browser = "DuckDuckGo";
  } else if (/yabrowser\//i.test(userAgent)) {
    browser = "Yandex Browser";
  } else if (/samsungbrowser\//i.test(userAgent)) {
    browser = "Samsung Internet";
  } else if (/ucbrowser\//i.test(userAgent)) {
    browser = "UC Browser";
  } else if (/maxthon\//i.test(userAgent)) {
    browser = "Maxthon";
  } else if (/fxios\//i.test(userAgent)) {
    browser = "Firefox (iOS)";
  } else if (/firefox\//i.test(userAgent)) {
    browser = "Firefox";
  } else if (/crios\//i.test(userAgent)) {
    browser = "Chrome (iOS)";
  } else if (/chrome\//i.test(userAgent)) {
    browser = "Chrome";
  } else if (/safari\//i.test(userAgent) && !userAgent.includes("Chrome")) {
    browser = "Safari";
  } else if (/trident\//i.test(userAgent) || /msie /i.test(userAgent)) {
    browser = "Internet Explorer";
  }

  // Detect OS med versioner
  if (/windows nt 10\.0/i.test(userAgent)) {
    os = "Windows 10/11";
  } else if (/windows nt 6\.3/i.test(userAgent)) {
    os = "Windows 8.1";
  } else if (/windows nt 6\.2/i.test(userAgent)) {
    os = "Windows 8";
  } else if (/windows nt 6\.1/i.test(userAgent)) {
    os = "Windows 7";
  } else if (/windows/i.test(userAgent)) {
    os = "Windows";
  } else if (/mac os x (\d+[._]\d+)/i.test(userAgent)) {
    const match = userAgent.match(/mac os x (\d+[._]\d+)/i);
    os = match ? `macOS ${match[1].replace(/_/g, ".")}` : "macOS";
  } else if (/macintosh/i.test(userAgent)) {
    os = "macOS";
  } else if (/android (\d+(\.\d+)?)/i.test(userAgent)) {
    const match = userAgent.match(/android (\d+(\.\d+)?)/i);
    os = match ? `Android ${match[1]}` : "Android";
  } else if (
    /iphone os (\d+_\d+)/i.test(userAgent) ||
    /cpu os (\d+_\d+)/i.test(userAgent)
  ) {
    const match = userAgent.match(/(?:iphone )?os (\d+_\d+)/i);
    os = match ? `iOS ${match[1].replace(/_/g, ".")}` : "iOS";
  } else if (/ipad|ipod|iphone/i.test(userAgent)) {
    os = "iOS";
  } else if (/linux/i.test(userAgent)) {
    os = "Linux";
  }

  return { device, browser, os };
};

const getDeviceIcon = (device: string) => {
  switch (device) {
    case "Mobil":
      return <FaMobileAlt className="text-lg" />;
    case "Tablet":
      return <FaTabletAlt className="text-lg" />;
    default:
      return <FaDesktop className="text-lg" />;
  }
};

const Security = () => {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getActiveSessions();
      if (result.success && result.sessions) {
        setSessions(result.sessions);
      } else {
        setError(result.error || "Kunne ikke hente sessioner");
      }
    } catch {
      setError("Der opstod en fejl ved hentning af sessioner");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevoke = async (sessionId: string) => {
    setRevoking(sessionId);
    try {
      const result = await revokeSession(sessionId);
      if (result.success) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      } else {
        setError(result.error || "Kunne ikke fjerne session");
      }
    } catch {
      setError("Der opstod en fejl ved fjernelse af session");
    } finally {
      setRevoking(null);
    }
  };

  const handleRevokeAllOthers = async () => {
    setRevokingAll(true);
    setError(null);
    try {
      const result = await revokeAllOtherSessions();
      if (result.success) {
        // Behold kun den nuværende session
        setSessions((prev) => prev.filter((s) => s.is_current));
      } else {
        setError(result.error || "Kunne ikke logge ud af andre enheder");
      }
    } catch {
      setError("Der opstod en fejl ved udlogning af andre enheder");
    } finally {
      setRevokingAll(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("da-DK", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="md:text-base text-sm font-semibold">
            {t("security.active_sessions")}
          </h3>
          <p className="text-sm text-zinc-500">
            {t("security.active_sessions_desc")}
          </p>
        </div>
        <button
          onClick={fetchSessions}
          disabled={loading}
          className="btn btn-ghost btn-sm sm:tooltip"
          data-tip={t("security.refresh")}
        >
          <FaSync className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2].map((i) => (
            <div key={i} className="skeleton h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-8 text-zinc-500">
          <p>{t("security.no_sessions")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {[...sessions]
            .sort((a, b) => {
              // Sortér så current device er øverst
              if (a.is_current && !b.is_current) return -1;
              if (!a.is_current && b.is_current) return 1;
              return 0;
            })
            .map((session) => {
              const { device, browser, os } = parseUserAgent(
                session.user_agent,
                t,
              );
              const isRevoking = revoking === session.id;
              const isCurrent = session.is_current;

              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between py-4 bg-base-200 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-base-300 rounded-lg">
                      {getDeviceIcon(device)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {browser} - {os}
                        </span>
                        {isCurrent && (
                          <span className="badge badge-success badge-xs md:badge-sm flex items-center gap-1">
                            <FaCheck className="text-[10px] sm:text-xs " />
                            <span>{t("security.current")}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-500">{device}</p>
                      <p className="text-xs text-zinc-500">
                        {t("security.last_active")}:{" "}
                        {formatDate(session.updated_at || session.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isCurrent && (
                      <button
                        onClick={() => handleRevoke(session.id)}
                        disabled={isRevoking}
                        className="btn btn-soft btn-sm btn-error flex items-center gap-2 md:tooltip md:tooltip-left"
                        data-tip={t("security.revoke")}
                      >
                        {isRevoking ? (
                          <FaSpinner className="animate-spin" />
                        ) : (
                          <>
                            <FaTrash />
                            <span className="hidden sm:inline">
                              {t("logout")}
                            </span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Log ud af alle andre enheder knap */}
      {sessions.filter((s) => !s.is_current).length > 0 && (
        <div className="mt-4 pt-4 border-t border-base-300 items-center justify-center flex flex-col gap-2">
          <button
            onClick={handleRevokeAllOthers}
            disabled={revokingAll || loading}
            className="btn btn-sm btn-error btn-soft"
            title={t("security.logout_all_other_devices")}
          >
            {revokingAll ? (
              <>
                <FaSpinner className="animate-spin" />
                {t("security.logging_out_all")}
              </>
            ) : (
              <>
                <FaTrash />
                {t("security.logout_all_other_devices")}
              </>
            )}
          </button>
          <p className="text-xs text-zinc-500 mt-2 text-center">
            {t("security.logout_all_other_devices_desc")}
          </p>
        </div>
      )}
    </div>
  );
};

export default Security;
