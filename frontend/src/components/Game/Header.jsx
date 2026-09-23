import React from 'react';
import { Copy, Check, Clock } from 'lucide-react';
import './Game.css';

export default function Header({
  roomId,
  currentRound,
  totalRounds,
  wordMask,
  isDrawer,
  drawerWord,
  timeLeft,
  phase
}) {
  const [copied, setCopied] = React.useState(false);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isTimeUrgent = timeLeft <= 10 && phase === 'DRAWING';

  return (
    <header className="game-header">
      {/* Round Info & Room Code */}
      <div className="header-round-info">
        <span className="round-label">
          Room: <strong style={{ color: '#ffffff', cursor: 'pointer' }} onClick={copyRoomCode} title="Click to copy">
            {roomId} {copied ? <Check size={12} style={{ display: 'inline', color: '#4ade80' }} /> : <Copy size={12} style={{ display: 'inline' }} />}
          </strong>
        </span>
        <span className="round-value">
          Round {currentRound} / {totalRounds}
        </span>
      </div>

      {/* Word / Hints Display */}
      <div className="header-word-box">
        {phase === 'WORD_SELECTION' ? (
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
            {isDrawer ? 'Pick a word below...' : 'Drawer is choosing a word...'}
          </span>
        ) : isDrawer ? (
          <>
            <span className="word-subtext">You are drawing</span>
            <span className="word-display drawer-word">{drawerWord}</span>
          </>
        ) : (
          <>
            <span className="word-subtext">Guess the word ({wordMask ? wordMask.replace(/\s/g, '').length : 0} letters)</span>
            <span className="word-display">{wordMask || '...'}</span>
          </>
        )}
      </div>

      {/* Authoritative Timer */}
      <div className={`header-timer ${isTimeUrgent ? 'urgent' : ''}`} title="Time Remaining">
        {timeLeft}
      </div>
    </header>
  );
}
