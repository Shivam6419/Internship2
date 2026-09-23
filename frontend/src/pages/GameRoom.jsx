import React from 'react';
import Header from '../components/Game/Header';
import PlayerList from '../components/Game/PlayerList';
import Canvas from '../components/Canvas/Canvas';
import ChatBox from '../components/Chat/ChatBox';
import WordSelectModal from '../components/Game/WordSelectModal';
import RoundEndOverlay from '../components/Game/RoundEndOverlay';
import GameOverModal from '../components/Game/GameOverModal';
import Lobby from '../components/Lobby/Lobby';

export default function GameRoom({
  gameState,
  onLeaveRoom
}) {
  const {
    roomState,
    myPlayer,
    isDrawer,
    isHost,
    messages,
    wordOptions,
    showWordModal,
    currentWord,
    wordMask,
    timeLeft,
    roundResult,
    gameOverData,
    updateSettings,
    startGame,
    chooseWord,
    sendGuess,
    playAgain
  } = gameState;

  if (!roomState) return null;

  // LOBBY PHASE
  if (roomState.phase === 'LOBBY') {
    return (
      <div style={{ minHeight: '100vh', padding: '24px 16px', background: 'var(--bg-page)' }}>
        <Lobby
          roomState={roomState}
          myPlayer={myPlayer}
          isHost={isHost}
          onUpdateSettings={updateSettings}
          onStartGame={startGame}
          messages={messages}
          onSendMessage={sendGuess}
          onLeaveRoom={onLeaveRoom}
        />
      </div>
    );
  }

  // ACTIVE GAMEPLAY (WORD_SELECTION, DRAWING, ROUND_END, GAME_OVER)
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '14px 16px', background: 'var(--bg-page)', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Header */}
      <Header
        roomId={roomState.roomId}
        currentRound={roomState.currentRound}
        totalRounds={roomState.totalRounds}
        wordMask={wordMask}
        isDrawer={isDrawer}
        drawerWord={currentWord}
        timeLeft={timeLeft}
        phase={roomState.phase}
      />

      {/* Main 3-Column Gameplay Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '240px 1fr 320px',
          gap: '14px',
          flex: 1,
          minHeight: '520px'
        }}
      >
        {/* Left: Player Leaderboard */}
        <PlayerList
          players={roomState.players}
          myId={myPlayer?.id}
          drawerId={roomState.drawerId}
          phase={roomState.phase}
        />

        {/* Center: Interactive Canvas */}
        <Canvas
          isDrawer={isDrawer && roomState.phase === 'DRAWING'}
          drawerName={roomState.drawerName}
        />

        {/* Right: Real-Time Chat & Guesses */}
        <ChatBox
          messages={messages}
          onSendMessage={sendGuess}
          isDrawer={isDrawer}
          hasGuessed={Boolean(myPlayer?.hasGuessed)}
          phase={roomState.phase}
        />
      </div>

      {/* Modals & Overlays */}
      <WordSelectModal
        isOpen={showWordModal}
        words={wordOptions}
        onSelectWord={chooseWord}
      />

      <RoundEndOverlay
        roundResult={roundResult}
      />

      <GameOverModal
        gameOverData={gameOverData}
        isHost={isHost}
        onPlayAgain={playAgain}
        onLeaveRoom={onLeaveRoom}
      />
    </div>
  );
}
