import React from 'react';
import { SocketProvider, useSocket } from './context/SocketContext';
import { useGameState } from './hooks/useGameState';
import Home from './pages/Home';
import GameRoom from './pages/GameRoom';

function MainApp() {
  const gameState = useGameState();
  const { socketError, setSocketError } = useSocket();

  return (
    <>
      {/* Global Error Banner */}
      {socketError && (
        <div
          style={{
            position: 'fixed',
            top: 16,
            right: 16,
            zIndex: 100,
            background: 'var(--danger)',
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: '0.9rem',
            fontWeight: 700
          }}
        >
          <span>⚠️ {socketError}</span>
          <button
            onClick={() => setSocketError(null)}
            style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', fontWeight: 800 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* View routing: Room View vs Landing Home View */}
      {gameState.roomState ? (
        <GameRoom
          gameState={gameState}
          onLeaveRoom={gameState.leaveRoom}
        />
      ) : (
        <Home
          onCreateRoom={gameState.createRoom}
          onJoinRoom={gameState.joinRoom}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <SocketProvider>
      <MainApp />
    </SocketProvider>
  );
}
