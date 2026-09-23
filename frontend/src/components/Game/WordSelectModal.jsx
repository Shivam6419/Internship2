import React, { useState, useEffect } from 'react';
import './Game.css';

export default function WordSelectModal({
  words = [],
  onSelectWord,
  isOpen
}) {
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(15);
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => (prev > 1 ? prev - 1 : 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen || words.length === 0) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content-card">
        <h2 style={{ fontFamily: 'var(--font-display)', color: '#38bdf8' }}>
          Choose a Word to Draw!
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
          Auto-selecting in <strong style={{ color: '#f59e0b' }}>{countdown}s</strong>
        </p>

        <div className="word-options-grid">
          {words.map((word) => (
            <button
              key={word}
              className="word-choice-btn"
              onClick={() => onSelectWord(word)}
            >
              {word}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
