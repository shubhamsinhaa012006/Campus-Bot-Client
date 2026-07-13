import { useState } from "react";
import HeroSection from "./HeroSection.jsx";
import ChatWindow from "./ChatWindow.jsx";

function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="chat-app">
      {!isOpen && (
        <HeroSection onOpenChat={() => setIsOpen(true)} />
      )}

      {isOpen && (
        <ChatWindow onClose={() => setIsOpen(false)} />
      )}
    </div>
  );
}

export default ChatWidget;