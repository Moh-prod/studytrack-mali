import { useState, useCallback, useRef } from "react";
import { chatWithCoach } from "../utils/aiService";

/**
 * useAICoach — Hook personnalisé pour le chatbot Coach IA.
 *
 * Gère l'historique des messages, l'envoi de requêtes à Gemini,
 * et l'injection automatique du contexte utilisateur.
 */
export default function useAICoach({ tasks, habits, streak }) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const historyRef = useRef([]); // Gemini-formatted history

  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim() || isLoading) return;

      const userMsg = {
        role: "user",
        text: text.trim(),
        timestamp: Date.now(),
      };
      setMessages((prev) => [
        ...prev,
        userMsg,
        { role: "model", text: "", timestamp: Date.now(), isStreaming: true },
      ]);
      setIsLoading(true);
      setError(null);

      try {
        const { streamChatWithCoach } = await import("../utils/aiService");
        const response = await streamChatWithCoach(
          historyRef.current,
          text.trim(),
          { tasks, habits, streak },
          (chunkText) => {
            setIsLoading(false);
            setMessages((prev) => {
              const newMsgs = [...prev];
              const lastIdx = newMsgs.length - 1;
              if (
                newMsgs[lastIdx].role === "model" &&
                newMsgs[lastIdx].isStreaming
              ) {
                newMsgs[lastIdx] = { ...newMsgs[lastIdx], text: chunkText };
              }
              return newMsgs;
            });
          },
        );

        // Finalize the message
        setMessages((prev) => {
          const newMsgs = [...prev];
          const lastIdx = newMsgs.length - 1;
          if (
            newMsgs[lastIdx].role === "model" &&
            newMsgs[lastIdx].isStreaming
          ) {
            newMsgs[lastIdx] = {
              ...newMsgs[lastIdx],
              text: response,
              isStreaming: false,
            };
          }
          return newMsgs;
        });

        // Update Gemini history
        historyRef.current = [
          ...historyRef.current,
          {
            role: "user",
            parts: [
              {
                text:
                  historyRef.current.length === 0
                    ? `[contexte injecté]\n\nMessage de l'étudiant : ${text.trim()}`
                    : text.trim(),
              },
            ],
          },
          { role: "model", parts: [{ text: response }] },
        ];
      } catch (err) {
        setError("Erreur de connexion au coach IA");
        setMessages((prev) => {
          const newMsgs = [...prev];
          const lastIdx = newMsgs.length - 1;
          if (
            newMsgs[lastIdx].role === "model" &&
            newMsgs[lastIdx].isStreaming
          ) {
            newMsgs[lastIdx] = {
              ...newMsgs[lastIdx],
              text: "Désolé, une erreur est survenue. Réessaie dans quelques instants.",
              isError: true,
              isStreaming: false,
            };
          }
          return newMsgs;
        });
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, tasks, habits, streak],
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    historyRef.current = [];
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
  };
}
