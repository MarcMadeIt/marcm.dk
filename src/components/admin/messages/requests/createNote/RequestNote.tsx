import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  createRequestNote,
  getNotesByRequestId,
  deleteRequestNote,
} from "@/lib/server/actions";
import { FaTrashAlt } from "react-icons/fa";

const RequestNote = ({ requestId }: { requestId: string }) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState("");
  const [notes, setNotes] = useState<
    { id: string; message: string; created_at: string }[]
  >([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [charCount, setCharCount] = useState(0);
  const maxCharLimit = 50;

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const fetchedNotes = await getNotesByRequestId(requestId);
        setNotes(
          fetchedNotes.map((note) => ({
            id: note.id,
            message: note.message,
            created_at: note.created_at,
          }))
        );
      } catch (error) {
        console.error("Failed to fetch notes:", error);
      }
    };

    fetchNotes();
  }, [requestId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const currentTime = new Date().toISOString();
      const tempId = Math.random().toString();
      setNotes((prevNotes) => [
        ...prevNotes,
        { id: tempId, message, created_at: currentTime },
      ]);

      setMessage("");
      setToastMessage("Kundenote tilføjet");
      setShowToast(true);

      const newNote = await createRequestNote(message, requestId);

      setNotes((prevNotes) =>
        prevNotes.map((note) =>
          note.id === tempId
            ? { ...note, id: newNote.id, created_at: newNote.created_at }
            : note
        )
      );
    } catch {
      setToastMessage("Fejl ved tilføjelse af kundenote");
      setShowToast(true);
    }
  };

  const handleDelete = async (noteId: string) => {
    try {
      await deleteRequestNote(noteId);
      setNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId));
      setToastMessage("Kundenote slettet");
      setShowToast(true);
    } catch (error) {
      console.error("Failed to delete note:", error);
      setToastMessage("Failed to delete note");
      setShowToast(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    setCharCount(e.target.value.length);
  };

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  return (
    <div className="flex flex-col gap-2 w-full md:w-4/5 2xl:w-3/5">
      <span className="text-xs md:text-sm font-medium text-gray-400">
        {t("customer_notes")}
      </span>
      <hr className="border-base-300 rounded-lg" />
      <div className="flex flex-col gap-2">
        {notes.length === 0 ? (
          <p className="text-sm text-zinc-500">{t("no_notes_available")}</p>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="flex justify-between items-center gap-4 bg-base-100 p-2 rounded-lg"
            >
              <div className="flex flex-col gap-1 px-2">
                <p className="text-sm md:text-xl font-semibold">
                  {note.message}
                </p>
                <p className="text-xs text-zinc-500">
                  {note.created_at
                    ? new Date(note.created_at).toLocaleDateString("da-DK")
                    : t("invalid_date")}
                </p>
              </div>
              <div>
                <button
                  className="btn btn-ghost"
                  onClick={() => handleDelete(note.id)}
                  aria-label={t("aria.requestNote.deleteButton")}
                >
                  {t("delete")}
                  <FaTrashAlt />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col lg:flex-row items-start gap-4 relative"
      >
        <div className="relative w-full max-w-xs">
          <input
            type="text"
            placeholder={t("write_note")}
            className="input input-bordered w-full max-w-xs"
            value={message}
            onChange={handleInputChange}
            maxLength={maxCharLimit}
            aria-label={t("aria.requestNote.inputNote")}
          />
          <span className="text-xs text-zinc-500 absolute -bottom-6 right-0">
            {charCount}/{maxCharLimit} {t("chars")}
          </span>
        </div>

        <button
          type="submit"
          className="btn"
          disabled={!message.trim()}
          aria-label={t("aria.requestNote.submitButton")}
        >
          {t("add_note")}
        </button>
      </form>
      {showToast && (
        <div className="hidden lg:block toast toast-end">
          <div
            className={`alert text-neutral-content ${
              toastMessage.includes("tilføjet") ||
              toastMessage.includes("slettet")
                ? "alert-success"
                : "alert-error"
            }`}
          >
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestNote;
