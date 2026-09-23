import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCw } from 'lucide-react';
import './Game.css';

export default function GameOverModal({
  gameOverData,
  isHost,
  onPlayAgain,
  onLeaveRoom
}) {
  if (!gameOverData) return null;

  const { winner, leaderboard = [] } = gameOverData;

  // Trigger celebration confetti
  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  return (
    <div className="modal-backdrop">
      <div className="modal-content-card" style={{ maxWidth: '540px' }}>
        <div style={{ display: 'inline-flex', padding: 12, background: 'rgba(245, 158, 11, 0.15)', borderRadius: '50%', marginBottom: 12 }}>
          <Trophy size={48} color="#f59e0b" />
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', color: '#f59e0b', fontSize: '2rem' }}>
          Game Over!
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: 4 }}>
          Congratulations to <strong>{winner?.name}</strong> for winning with {winner?.score} points!
        </p>

        {/* Podium for top 3 */}
        <div className="podium-container">
          {/* 2nd Place */}
          {leaderboard[1] && (
            <div className="podium-step">
              <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{leaderboard[1].avatar}</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 4 }}>{leaderboard[1].name}</div>
              <div className="podium-pillar podium-2">
                <span>#2</span>
                <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>{leaderboard[1].score} pts</span>
              </div>
            </div>
          )}

          {/* 1st Place */}
          {leaderboard[0] && (
            <div className="podium-step">
              <div style={{ fontSize: '1.8rem', marginBottom: 4 }}>{leaderboard[0].avatar}</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: 4 }}>{leaderboard[0].name}</div>
              <div className="podium-pillar podium-1">
                <span style={{ fontSize: '1.4rem' }}>👑 #1</span>
                <span style={{ fontSize: '0.85rem' }}>{leaderboard[0].score} pts</span>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {leaderboard[2] && (
            <div className="podium-step">
              <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{leaderboard[2].avatar}</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 4 }}>{leaderboard[2].name}</div>
              <div className="podium-pillar podium-3">
                <span>#3</span>
                <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>{leaderboard[2].score} pts</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 20 }}>
          {isHost ? (
            <button
              className="word-choice-btn"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 20px', background: 'var(--primary)' }}
              onClick={onPlayAgain}
            >
              <RotateCw size={18} />
              <span>Play Again</span>
            </button>
          ) : (
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', alignSelf: 'center' }}>
              Waiting for host to restart game...
            </span>
          )}

          <button
            className="word-choice-btn"
            style={{ padding: '12px 20px', background: 'var(--bg-card-alt)' }}
            onClick={onLeaveRoom}
          >
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
}
