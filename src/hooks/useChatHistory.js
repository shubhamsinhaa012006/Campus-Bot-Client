import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "campus-ai-chat-history";

const createDefaultSession = () => ({
    id: Date.now().toString(),
    title: "New Chat",
    updatedAt: Date.now(),
    messages: [
        {
            role: "model",
            text: "Hi! I'm your AI assistant. Ask me anything, by typing or by voice.",
        },
    ],
});

export default function useChatHistory() {
    const [sessions, setSessions] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(null);

    // Load saved chats
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved) {
            const parsed = JSON.parse(saved);

            if (parsed.length > 0) {
                setSessions(parsed);
                setActiveSessionId(parsed[0].id);
                return;
            }
        }

        const first = createDefaultSession();

        setSessions([first]);
        setActiveSessionId(first.id);
    }, []);

    // Save automatically
    useEffect(() => {
        if (sessions.length) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
        }
    }, [sessions]);

    const activeSession = useMemo(() => {
        return sessions.find((s) => s.id === activeSessionId);
    }, [sessions, activeSessionId]);

    function createSession() {
        const session = createDefaultSession();

        setSessions((prev) => [session, ...prev]);
        setActiveSessionId(session.id);
    }

    function updateMessages(messages) {
        setSessions((prev) =>
            prev
                .map((session) => {
                    if (session.id !== activeSessionId) return session;

                    let title = session.title;

                    if (title === "New Chat") {
                        const firstUser = messages.find((m) => m.role === "user");

                        if (firstUser) {
                            title =
                                firstUser.text.length > 30
                                    ? firstUser.text.substring(0, 30) + "..."
                                    : firstUser.text;
                        }
                    }

                    return {
                        ...session,
                        title,
                        updatedAt: Date.now(),
                        messages,
                    };
                })
                .sort((a, b) => b.updatedAt - a.updatedAt)
        );
    }

    function deleteSession(id) {
        const remaining = sessions.filter((s) => s.id !== id);

        if (!remaining.length) {
            const session = createDefaultSession();

            setSessions([session]);
            setActiveSessionId(session.id);

            return;
        }

        setSessions(remaining);

        if (activeSessionId === id) {
            setActiveSessionId(remaining[0].id);
        }
    }

    return {
        sessions,
        activeSession,
        activeSessionId,
        setActiveSessionId,
        createSession,
        updateMessages,
        deleteSession,
    };
}