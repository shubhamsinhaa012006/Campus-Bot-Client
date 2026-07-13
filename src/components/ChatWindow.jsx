import { useState, useRef, useEffect } from "react";
import { sendMessage } from "../services/chatApi.js";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition.js";
import { speakText } from "../hooks/useSpeechSynthesis.js";
import { useChatHistory } from "../hooks/useChatHistory.js";

function ChatWindow({ onClose }) {
  const {
    sessions,
    activeSessionId,
    activeSession,
    setActiveSessionId,
    createNewChat,
    updateActiveSession,
    deleteSession,
  } = useChatHistory();

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [voiceReplyEnabled, setVoiceReplyEnabled] = useState(true);

  const messagesEndRef = useRef(null);

  const messages = activeSession?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Builds the Gemini-style history array from our simple messages state.
  // Gemini requires history to start with role "user", so we drop any
  // leading "model" messages (like our initial greeting) before sending.
  const buildHistory = (msgs) => {
    const firstUserIndex = msgs.findIndex((m) => m.role === "user");
    if (firstUserIndex === -1) return [];
    return msgs.slice(firstUserIndex).map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    }));
  };

  const handleSend = async (textToSend) => {
    const text = (textToSend ?? input).trim();
    if (!text || isLoading) return;

    const historyBeforeThisMessage = buildHistory(messages);
    const userMessage = { id: crypto.randomUUID(), role: "user", text };
    
    const newMessagesWithUser = [...messages, userMessage];
    updateActiveSession(newMessagesWithUser);
    
    setInput("");
    setIsLoading(true);

    try {
      const reply = await sendMessage(text, historyBeforeThisMessage);
      updateActiveSession([...newMessagesWithUser, { id: crypto.randomUUID(), role: "model", text: reply }]);
      if (voiceReplyEnabled) speakText(reply);
    } catch (err) {
      updateActiveSession([
        ...newMessagesWithUser,
        { id: crypto.randomUUID(), role: "model", text: "Sorry, I couldn't reach the server. Is it running?" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const { startListening, isListening, isSupported } = useSpeechRecognition(
    (transcript) => {
      handleSend(transcript);
    }
  );

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  if (!activeSession) {
    return null;
  }

  return (
    <div className="chat-window">
      {/* Sidebar for multiple sessions */}
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <button className="new-chat-btn" onClick={createNewChat} aria-label="New Chat">
            + New Chat
          </button>
        </div>
        <div className="session-list">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`session-item ${session.id === activeSessionId ? "active" : ""}`}
              onClick={() => setActiveSessionId(session.id)}
            >
              <span className="session-title">{session.title}</span>
              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm("Delete this chat?")) {
                    deleteSession(session.id);
                  }
                }}
                title="Delete Chat"
                aria-label="Delete Chat"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="chat-main">
        <div className="chat-header">
          <span> Campus AI Assistant</span>
          <button className="close-btn" onClick={onClose} aria-label="Close Chat">
            ✕
          </button>
        </div>

        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={msg.id || `msg-${i}`} className={`chat-bubble ${msg.role}`}>
              {msg.text}
            </div>
          ))}
          {isLoading && <div className="chat-bubble model typing">Thinking...</div>}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-row">
          <button
            className={`mic-btn ${isListening ? "listening" : ""}`}
            onClick={startListening}
            title={isSupported ? "Speak your message" : "Voice input not supported in this browser"}
            aria-label="Voice Input"
            disabled={isLoading}
          >
            🎤
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Listening..." : "Type your message..."}
            disabled={isLoading}
          />

          <button className="send-btn" onClick={() => handleSend()} aria-label="Send Message" disabled={isLoading}>
            Send
          </button>
        </div>

        <label className="voice-toggle">
          <input
            type="checkbox"
            checked={voiceReplyEnabled}
            onChange={(e) => setVoiceReplyEnabled(e.target.checked)}
          />
          Read replies aloud
        </label>
      </div>
    </div>
  );
}

export default ChatWindow;
