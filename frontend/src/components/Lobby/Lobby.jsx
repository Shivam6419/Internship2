import React, { useState } from 'react';
import { Copy, Check, Share2, Play, Users, Crown } from 'lucide-react';
import ChatBox from '../Chat/ChatBox';
import './Lobby.css';

export default function Lobby({
  roomState,
  myPlayer,
  isHost,
  onUpdateSettings,
  onStartGame,
  messages,
  onSendMessage,
  onLeaveRoom
}) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const { roomId, settings, players = [] } = roomState || {};

  const copyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/?room=${roomId}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSettingChange = (key, value) => {
    if (!isHost) return;
    onUpdateSettings({ ...settings, [key]: value });
  };

  const canStart = players.length >= 2;

  return (
    <div className="lobby-layout">
      {/* Left Column: Room Info, Settings, and Players */}
      <div className="lobby-panel">
        {/* Room Header with Code & Link */}
        <div className="lobby-room-header">
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', color: '#38bdf8' }}>
              Game Lobby
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Share room code or invite link with your friends to play!
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div className="room-code-tag">
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>CODE:</span>
              <strong style={{ letterSpacing: '0.08em', color: '#ffffff' }}>{roomId}</strong>
              <button
                onClick={copyCode}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                title="Copy Room Code"
              >
                {copiedCode ? <Check size={16} color="#4ade80" /> : <Copy size={16} />}
              </button>
            </div>

            <button className="copy-link-btn" onClick={copyInviteLink} title="Copy Invite Link">
              <Share2 size={16} />
              <span>{copiedLink ? 'Copied Link!' : 'Invite Link'}</span>
            </button>
          </div>
        </div>

        {/* Room Settings (Host Configurable) */}
        <div>
          <h4 style={{ color: 'var(--text-secondary)', marginBottom: 12, fontSize: '0.9rem', textTransform: 'uppercase' }}>
            Room Settings {isHost ? '(Configurable by Host)' : '(View Only)'}
          </h4>

          <div className="settings-grid">
            {/* Rounds */}
            <div className="setting-item">
              <label className="setting-label">Total Rounds</label>
              <select
                className="setting-select"
                value={settings?.rounds || 3}
                disabled={!isHost}
                onChange={(e) => handleSettingChange('rounds', Number(e.target.value))}
              >
                {[2, 3, 4, 5, 6, 8, 10].map(r => (
                  <option key={r} value={r}>{r} Rounds</option>
                ))}
              </select>
            </div>

            {/* Draw Time */}
            <div className="setting-item">
              <label className="setting-label">Draw Time (seconds)</label>
              <select
                className="setting-select"
                value={settings?.drawTime || 60}
                disabled={!isHost}
                onChange={(e) => handleSettingChange('drawTime', Number(e.target.value))}
              >
                {[30, 45, 60, 80, 100, 120, 180].map(t => (
                  <option key={t} value={t}>{t} seconds</option>
                ))}
              </select>
            </div>

            {/* Word Choices */}
            <div className="setting-item">
              <label className="setting-label">Word Choices</label>
              <select
                className="setting-select"
                value={settings?.wordCount || 3}
                disabled={!isHost}
                onChange={(e) => handleSettingChange('wordCount', Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5].map(w => (
                  <option key={w} value={w}>{w} Words</option>
                ))}
              </select>
            </div>

            {/* Hints */}
            <div className="setting-item">
              <label className="setting-label">Hints</label>
              <select
                className="setting-select"
                value={settings?.hints ?? 2}
                disabled={!isHost}
                onChange={(e) => handleSettingChange('hints', Number(e.target.value))}
              >
                {[0, 1, 2, 3, 4, 5].map(h => (
                  <option key={h} value={h}>{h === 0 ? 'Disabled' : `${h} Hints`}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Players in Lobby */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase' }}>
              Players in Room ({players.length} / {settings?.maxPlayers || 8})
            </h4>
            {!canStart && (
              <span style={{ fontSize: '0.8rem', color: '#f59e0b' }}>
                At least 2 players needed to start
              </span>
            )}
          </div>

          <div className="lobby-players-grid">
            {players.map((p) => (
              <div
                key={p.id}
                className={`lobby-player-card ${p.id === myPlayer?.id ? 'is-me' : ''}`}
              >
                <div style={{ fontSize: '2rem', marginBottom: 4 }}>{p.avatar || '🎨'}</div>
                <strong style={{ fontSize: '0.9rem', color: '#ffffff' }}>
                  {p.name}
                </strong>
                {p.isHost && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: '#f59e0b', marginTop: 4 }}>
                    <Crown size={12} /> Host
                  </span>
                )}
                {p.id === myPlayer?.id && (
                  <span style={{ fontSize: '0.75rem', color: '#60a5fa', marginTop: 2 }}>(You)</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Start Game Button or Waiting Notice */}
        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          {isHost ? (
            <button
              className="start-game-btn"
              disabled={!canStart}
              onClick={onStartGame}
              style={{ width: '100%' }}
            >
              <Play size={20} />
              <span>{canStart ? 'Start Game' : 'Waiting for more players...'}</span>
            </button>
          ) : (
            <div style={{ textAlign: 'center', padding: 12, background: 'var(--bg-card-alt)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)' }}>
              ⏳ Waiting for host to start the game...
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Pre-game Chat */}
      <div style={{ height: '550px' }}>
        <ChatBox
          messages={messages}
          onSendMessage={onSendMessage}
          isDrawer={false}
          hasGuessed={false}
          phase="LOBBY"
        />
      </div>
    </div>
  );
}
