import { useState, useEffect, useMemo } from "react";

const STORAGE_KEY = "chat_history";

const DEFAULT_MESSAGE = {
  role: "model",
  text: "Hi! I'm your AI assistant. Ask me anything, by typing or by voice.",
};

export function useChatHistory() {
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to load chat history from localStorage", e);
        // Remove corrupted data so the app can recover automatically
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    // Default initial session
    return [
      {
        id: crypto.randomUUID(),
        title: "New Chat",
        messages: [{ ...DEFAULT_MESSAGE }],
        updatedAt: Date.now(),
      }
    ];
  });

  const [activeSessionId, setActiveSessionId] = useState(null);

  useEffect(() => {
    if (!activeSessionId && sessions.length > 0) {
      setActiveSessionId(sessions[0].id);
    }
  }, [sessions, activeSessionId]);

  // Persist to localStorage whenever sessions change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [sessions]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;

  const createNewChat = () => {
    const newSession = {
      id: crypto.randomUUID(),
      title: "New Chat",
      messages: [{ ...DEFAULT_MESSAGE }],
      updatedAt: Date.now(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  const updateActiveSession = (newMessages) => {
    setSessions((prev) =>
      prev.map((session) => {
        if (session.id === activeSessionId) {
          let title = session.title;
          // Automatically generate title from the first user message if it's still "New Chat"
          if (title === "New Chat") {
            const firstUserMessage = newMessages.find((m) => m.role === "user");
            if (firstUserMessage) {
              const text = firstUserMessage.text;
              title = text.length > 30 ? text.substring(0, 30) + "..." : text;
            }
          }
          return {
            ...session,
            messages: newMessages,
            title,
            updatedAt: Date.now(),
          };
        }
        return session;
      })
    );
  };

  const deleteSession = (id) => {
    setSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== id);
      if (remaining.length === 0) {
        // If the last conversation is deleted, automatically create a new one
        const newSession = {
          id: crypto.randomUUID(),
          title: "New Chat",
          messages: [{ ...DEFAULT_MESSAGE }],
          updatedAt: Date.now(),
        };
        setActiveSessionId(newSession.id);
        return [newSession];
      }

      if (id === activeSessionId) {
        // Switch to the most recently updated remaining session
        const nextActive = [...remaining].sort((a, b) => b.updatedAt - a.updatedAt)[0];
        setActiveSessionId(nextActive.id);
      }
      return remaining;
    });
  };

  return {
    sessions: sortedSessions,
    activeSessionId,
    activeSession,
    setActiveSessionId,
    createNewChat,
    updateActiveSession,
    deleteSession,
  };
}