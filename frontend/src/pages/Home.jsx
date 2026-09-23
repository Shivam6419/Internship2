import React, { useState, useEffect } from 'react';
import { Palette, Play, Users, PlusCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { checkHealth, BACKEND_URL } from '../services/api';
import './Home.css';

const AVATARS = ['🐶', '🐱', '🦊', '🐼', '🦁', '🐯', '🐸', '🐵', '🦄', '🚀', '🤖', '🍕'];

export default function Home({ onCreateRoom, onJoinRoom }) {
  const [activeTab, setActiveTab] = useState('create'); // 'create' or 'join'
  const [playerName, setPlayerName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  
  // Settings for room creation
  const [settings, setSettings] = useState({
    rounds: 3,
    drawTime: 60,
    maxPlayers: 8,
    wordCount: 3,
    hints: 2,
    isPrivate: false
  });

  const [backendHealth, setBackendHealth] = useState({ status: 'checking' });
  const [errorMsg, setErrorMsg] = useState('');

  // Check URL parameters for direct room link (e.g. ?room=ABCD12)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setRoomCodeInput(roomParam.toUpperCase());
      setActiveTab('join');
    }

    // Ping backend health
    checkHealth().then(data => setBackendHealth(data));
  }, []);

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setErrorMsg('Please enter your player name');
      return;
    }
    setErrorMsg('');
    onCreateRoom(playerName.trim(), selectedAvatar, settings);
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setErrorMsg('Please enter your player name');
      return;
    }
    if (!roomCodeInput.trim()) {
      setErrorMsg('Please enter the 6-character room code');
      return;
    }
    setErrorMsg('');
    onJoinRoom(roomCodeInput.trim().toUpperCase(), playerName.trim(), selectedAvatar);
  };

  return (
    <div className="home-container">
      <div className="home-card">
        {/* Header & Logo */}
        <div>
          <h1 className="home-logo-title">
            <span>🎨</span> skribbl.io
          </h1>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: 4 }}>
            Multiplayer Real-time Drawing & Guessing Game
          </p>

          {/* Backend Status indicator */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
            <span
              style={{
                fontSize: '0.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '2px 10px',
                borderRadius: '999px',
                background: backendHealth.status === 'online' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: backendHealth.status === 'online' ? '#4ade80' : '#f87171'
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: backendHealth.status === 'online' ? '#22c55e' : '#ef4444' }} />
              {backendHealth.status === 'online' ? 'Server Connected' : 'Server Connecting...'}
            </span>
          </div>
        </div>

        {/* Player Name & Avatar Selection */}
        <div className="form-group">
          <label className="form-label">Your Name</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. MasterArtist"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={16}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Pick Avatar</label>
          <div className="avatar-picker-grid">
            {AVATARS.map((avatar) => (
              <button
                key={avatar}
                type="button"
                className={`avatar-opt-btn ${selectedAvatar === avatar ? 'active' : ''}`}
                onClick={() => setSelectedAvatar(avatar)}
              >
                {avatar}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Switcher: Create vs Join */}
        <div className="home-tabs">
          <button
            type="button"
            className={`home-tab-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            Create Room
          </button>
          <button
            type="button"
            className={`home-tab-btn ${activeTab === 'join' ? 'active' : ''}`}
            onClick={() => setActiveTab('join')}
          >
            Join Room
          </button>
        </div>

        {errorMsg && (
          <div style={{ color: '#f87171', fontSize: '0.85rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: 8, borderRadius: 6 }}>
            {errorMsg}
          </div>
        )}

        {/* Form Tab 1: Create Room */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Rounds</label>
                <select
                  className="form-input"
                  value={settings.rounds}
                  onChange={(e) => setSettings({ ...settings, rounds: Number(e.target.value) })}
                >
                  {[2, 3, 4, 5, 8, 10].map(r => (
                    <option key={r} value={r}>{r} Rounds</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Draw Time</label>
                <select
                  className="form-input"
                  value={settings.drawTime}
                  onChange={(e) => setSettings({ ...settings, drawTime: Number(e.target.value) })}
                >
                  {[30, 45, 60, 80, 100, 120].map(t => (
                    <option key={t} value={t}>{t} seconds</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Max Players</label>
                <select
                  className="form-input"
                  value={settings.maxPlayers}
                  onChange={(e) => setSettings({ ...settings, maxPlayers: Number(e.target.value) })}
                >
                  {[4, 6, 8, 10, 12, 16, 20].map(p => (
                    <option key={p} value={p}>{p} Players</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Hints</label>
                <select
                  className="form-input"
                  value={settings.hints}
                  onChange={(e) => setSettings({ ...settings, hints: Number(e.target.value) })}
                >
                  {[0, 1, 2, 3, 4, 5].map(h => (
                    <option key={h} value={h}>{h === 0 ? 'Disabled' : `${h} Hints`}</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="primary-action-btn">
              <PlusCircle size={20} />
              <span>Create Private Room</span>
            </button>
          </form>
        )}

        {/* Form Tab 2: Join Room */}
        {activeTab === 'join' && (
          <form onSubmit={handleJoinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Room Code (6 letters)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. K9X2F7"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                maxLength={6}
                style={{ textAlign: 'center', letterSpacing: '0.2em', fontWeight: 800, fontSize: '1.25rem' }}
              />
            </div>

            <button type="submit" className="primary-action-btn">
              <ArrowRight size={20} />
              <span>Join Room</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
