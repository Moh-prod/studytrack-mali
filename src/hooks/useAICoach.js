import { useState, useCallback, useRef } from 'react';
import { chatWithCoach } from '../utils/aiService';

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

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading) return;

    const userMsg = { role: 'user', text: text.trim(), timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await chatWithCoach(
        historyRef.current,
        text.trim(),
        { tasks, habits, streak }
      );

      // Update Gemini history
      historyRef.current = [
        ...historyRef.current,
        { role: 'user', parts: [{ text: historyRef.current.length === 0
          ? `[contexte injecté]\n\nMessage de l'étudiant : ${text.trim()}`
          : text.trim() }] },
        { role: 'model', parts: [{ text: response }] },
      ];

      const botMsg = { role: 'model', text: response, timestamp: Date.now() };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setError('Erreur de connexion au coach IA');
      const errorMsg = {
        role: 'model',
        text: 'Désolé, une erreur est survenue. Réessaie dans quelques instants.',
        timestamp: Date.now(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, tasks, habits, streak]);

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
