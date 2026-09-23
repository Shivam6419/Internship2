import React from 'react';
import { Crown, Pencil, CheckCircle2, Users } from 'lucide-react';
import './Game.css';

export default function PlayerList({
  players = [],
  myId,
  drawerId,
  phase
}) {
  // Sort players by score descending for dynamic leaderboard ranking
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="player-list-container">
      {/* Header */}
      <div className="player-list-header">
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Users size={16} />
          <span>Players ({players.length})</span>
        </span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Scores
        </span>
      </div>

      {/* Players List */}
      <div className="player-cards-scroll">
        {sortedPlayers.map((player, index) => {
          const isMe = player.id === myId;
          const isCurrentDrawer = player.id === drawerId && phase !== 'LOBBY';
          const hasGuessed = player.hasGuessed;

          return (
            <div
              key={player.id}
              className={`player-card ${isMe ? 'is-me' : ''} ${isCurrentDrawer ? 'is-drawer' : ''} ${hasGuessed ? 'has-guessed' : ''}`}
            >
              {/* Rank */}
              <div className="player-rank">#{index + 1}</div>

              {/* Avatar */}
              <div className="player-avatar">{player.avatar || '🎨'}</div>

              {/* Info */}
              <div className="player-info">
                <div className="player-name-row">
                  <span className="player-name">
                    {player.name} {isMe && <span style={{ color: 'var(--text-secondary)' }}>(You)</span>}
                  </span>
                  {player.isHost && (
                    <Crown size={14} color="#f59e0b" title="Room Host" />
                  )}
                  {isCurrentDrawer && (
                    <Pencil size={14} color="#38bdf8" title="Drawing Now" />
                  )}
                  {hasGuessed && (
                    <CheckCircle2 size={14} color="#22c55e" title="Guessed Word" />
                  )}
                </div>
                <div className="player-score">{player.score} points</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
