function HeroSection({ onOpenChat }) {
  return (
    <section className="hero">
      <h1>⚡ Campus AI</h1>

      <div className="hero-chat-box" onClick={onOpenChat}>
        <div className="hero-chat-icon">💬</div>
        <h2>Talk to the AI Assistant</h2>
        <p>Click here to start chatting — by text or by voice</p>
      </div>
    </section>
  );
}

export default HeroSection;
