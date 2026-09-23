import React from 'react';
import './Game.css';

export default function RoundEndOverlay({ roundResult }) {
  if (!roundResult) return null;

  const { word, reason, scores = [], correctCount = 0, totalEligible = 0 } = roundResult;

  const getReasonText = () => {
    if (reason === 'all_guessed') return '🎉 Everyone guessed the word!';
    if (reason === 'drawer_left') return '⚠️ The drawer disconnected!';
    return '⏰ Time ran out!';
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content-card">
        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {getReasonText()}
        </span>

        <h3 style={{ marginTop: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
          The word was:
        </h3>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.5rem',
            color: '#4ade80',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            margin: '8px 0 16px'
          }}
        >
          {word}
        </h1>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 16 }}>
          {correctCount} out of {totalEligible} players guessed correctly.
        </p>

        {/* Quick scores preview */}
        <div style={{ background: 'var(--bg-card-alt)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 700 }}>
            CURRENT SCORES
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {scores.slice(0, 4).map((p) => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span>{p.avatar} {p.name}</span>
                <span style={{ fontWeight: 700, color: '#38bdf8' }}>{p.score} pts</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 16 }}>
          Next turn starting in a few seconds...
        </p>
      </div>
    </div>
  );
}
