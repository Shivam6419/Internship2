import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import './Chat.css';

export default function ChatBox({
  messages,
  onSendMessage,
  isDrawer,
  hasGuessed,
  phase
}) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  // Determine placeholder based on current turn state
  const getPlaceholder = () => {
    if (phase === 'LOBBY') return 'Say hello in lobby...';
    if (isDrawer) return 'Type here to chat (drawer cannot guess)';
    if (hasGuessed) return 'You guessed the word! Chat with other winners...';
    return 'Type your guess here...';
  };

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <MessageSquare size={16} />
          <span>Chat & Guesses</span>
        </span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {messages.length} messages
        </span>
      </div>

      {/* Message Feed */}
      <div className="chat-messages">
        {messages.map((msg) => {
          if (msg.type === 'system') {
            return (
              <div key={msg.id} className="msg-system">
                {msg.text}
              </div>
            );
          }

          if (msg.type === 'correct_guess') {
            return (
              <div key={msg.id} className="msg-correct">
                🎉 {msg.text}
              </div>
            );
          }

          if (msg.type === 'close_hint') {
            return (
              <div key={msg.id} className="msg-close">
                💡 {msg.text}
              </div>
            );
          }

          // Regular chat or post-guess chat
          return (
            <div key={msg.id} className="msg-chat">
              <span
                className={`msg-author ${msg.isDrawer ? 'drawer' : ''} ${msg.type === 'guessed_chat' ? 'guessed' : ''}`}
              >
                {msg.playerName}:
              </span>
              <span className={`msg-text ${msg.type === 'guessed_chat' ? 'guessed' : ''}`}>
                {msg.text}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="chat-input-field"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={getPlaceholder()}
          maxLength={100}
        />
        <button
          type="submit"
          className="chat-submit-btn"
          disabled={!inputText.trim()}
          title="Send"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
