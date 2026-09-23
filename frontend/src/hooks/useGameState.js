import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { EVENTS } from '../constants/events';

export function useGameState() {
  const { socket, isConnected } = useSocket();

  // Room & Player State
  const [roomState, setRoomState] = useState(null);
  const [myPlayer, setMyPlayer] = useState(null);
  const [messages, setMessages] = useState([]);
  
  // Game Flow State
  const [wordOptions, setWordOptions] = useState([]);
  const [showWordModal, setShowWordModal] = useState(false);
  const [currentWord, setCurrentWord] = useState('');
  const [wordMask, setWordMask] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [roundResult, setRoundResult] = useState(null);
  const [gameOverData, setGameOverData] = useState(null);

  // Derived properties
  const isDrawer = Boolean(roomState?.drawerId && myPlayer?.id && roomState.drawerId === myPlayer.id);
  const isHost = Boolean(myPlayer?.isHost);

  // SOCKET LISTENERS
  useEffect(() => {
    if (!socket) return;

    // Room created / joined
    const onRoomSuccess = ({ roomId, player, roomState }) => {
      setMyPlayer(player);
      setRoomState(roomState);
      setTimeLeft(roomState?.settings?.drawTime || 60);
      setMessages([{
        id: 'sys-welcome',
        type: 'system',
        text: `Welcome to room ${roomId}! Invite friends using the room code or link.`
      }]);
    };

    // Another player joined
    const onPlayerJoined = ({ player, players }) => {
      setRoomState(prev => prev ? { ...prev, players } : prev);
      setMessages(prev => [...prev, {
        id: Date.now() + Math.random().toString(),
        type: 'system',
        text: `${player.name} joined the room`
      }]);
    };

    // Player left
    const onPlayerLeft = ({ playerId, playerName, players, newHostId }) => {
      setRoomState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          players,
          hostId: newHostId || prev.hostId
        };
      });

      setMyPlayer(prev => {
        if (!prev) return null;
        if (newHostId && prev.id === newHostId) {
          return { ...prev, isHost: true };
        }
        return prev;
      });

      setMessages(prev => [...prev, {
        id: Date.now() + Math.random().toString(),
        type: 'system',
        text: `${playerName} left the room`
      }]);
    };

    // Settings updated
    const onSettingsUpdated = ({ settings }) => {
      setRoomState(prev => prev ? { ...prev, settings } : prev);
    };

    // Full Game State pulse
    const onGameState = (state) => {
      setRoomState(state);
      if (state.wordMask) setWordMask(state.wordMask);
      if (state.timeLeft !== undefined) setTimeLeft(state.timeLeft);
    };

    // Round started -> Word selection
    const onRoundStart = (data) => {
      setRoundResult(null);
      setGameOverData(null);
      setRoomState(prev => prev ? {
        ...prev,
        phase: 'WORD_SELECTION',
        drawerId: data.drawerId,
        drawerName: data.drawerName,
        currentRound: data.currentRound,
        totalRounds: data.totalRounds
      } : prev);

      if (data.isDrawer) {
        setWordOptions(data.wordOptions || []);
        setShowWordModal(true);
      } else {
        setWordOptions([]);
        setShowWordModal(false);
      }
    };

    // Word chosen by drawer -> Drawing begins
    const onWordChosen = (data) => {
      setShowWordModal(false);
      setRoomState(prev => prev ? { ...prev, phase: 'DRAWING' } : prev);
      setTimeLeft(data.timeLeft || 60);

      if (data.isDrawer) {
        setCurrentWord(data.word);
        setWordMask(data.word);
      } else {
        setCurrentWord('');
        setWordMask(data.wordMask);
      }
    };

    // Timer tick
    const onTimerTick = ({ timeLeft }) => {
      setTimeLeft(timeLeft);
    };

    // Hint revealed
    const onHintRevealed = ({ wordMask }) => {
      setWordMask(wordMask);
    };

    // Guess result (correct answer)
    const onGuessResult = ({ playerId, playerName, points, scores }) => {
      setRoomState(prev => {
        if (!prev) return null;
        const updatedPlayers = prev.players.map(p => {
          const match = scores.find(s => s.id === p.id);
          return match ? { ...p, score: match.score, hasGuessed: match.hasGuessed } : p;
        });
        return { ...prev, players: updatedPlayers };
      });

      setMyPlayer(prev => {
        if (!prev) return null;
        if (prev.id === playerId) {
          return { ...prev, hasGuessed: true, score: prev.score + points };
        }
        return prev;
      });

      setMessages(prev => [...prev, {
        id: Date.now() + Math.random().toString(),
        type: 'correct_guess',
        text: `${playerName} guessed the word! (+${points} pts)`
      }]);
    };

    // Chat / guess messages
    const onChatMessage = (message) => {
      setMessages(prev => [...prev, message]);
    };

    // Round ended
    const onRoundEnd = (data) => {
      setRoomState(prev => {
        if (!prev) return null;
        const updatedPlayers = prev.players.map(p => {
          const match = data.scores.find(s => s.id === p.id);
          return match ? { ...p, score: match.score, hasGuessed: false } : p;
        });
        return { ...prev, phase: 'ROUND_END', players: updatedPlayers };
      });

      setRoundResult(data);
      setCurrentWord(data.word);
      setWordMask(data.word);
    };

    // Game Over
    const onGameOver = (data) => {
      setGameOverData(data);
      setRoomState(prev => prev ? { ...prev, phase: 'GAME_OVER' } : prev);
    };

    socket.on(EVENTS.ROOM_CREATED, onRoomSuccess);
    socket.on(EVENTS.ROOM_JOINED, onRoomSuccess);
    socket.on(EVENTS.PLAYER_JOINED, onPlayerJoined);
    socket.on(EVENTS.PLAYER_LEFT, onPlayerLeft);
    socket.on(EVENTS.SETTINGS_UPDATED, onSettingsUpdated);
    socket.on(EVENTS.GAME_STATE, onGameState);
    socket.on(EVENTS.ROUND_START, onRoundStart);
    socket.on(EVENTS.WORD_CHOSEN, onWordChosen);
    socket.on(EVENTS.TIMER_TICK, onTimerTick);
    socket.on(EVENTS.HINT_REVEALED, onHintRevealed);
    socket.on(EVENTS.GUESS_RESULT, onGuessResult);
    socket.on(EVENTS.CHAT_MESSAGE, onChatMessage);
    socket.on(EVENTS.ROUND_END, onRoundEnd);
    socket.on(EVENTS.GAME_OVER, onGameOver);

    return () => {
      socket.off(EVENTS.ROOM_CREATED, onRoomSuccess);
      socket.off(EVENTS.ROOM_JOINED, onRoomSuccess);
      socket.off(EVENTS.PLAYER_JOINED, onPlayerJoined);
      socket.off(EVENTS.PLAYER_LEFT, onPlayerLeft);
      socket.off(EVENTS.SETTINGS_UPDATED, onSettingsUpdated);
      socket.off(EVENTS.GAME_STATE, onGameState);
      socket.off(EVENTS.ROUND_START, onRoundStart);
      socket.off(EVENTS.WORD_CHOSEN, onWordChosen);
      socket.off(EVENTS.TIMER_TICK, onTimerTick);
      socket.off(EVENTS.HINT_REVEALED, onHintRevealed);
      socket.off(EVENTS.GUESS_RESULT, onGuessResult);
      socket.off(EVENTS.CHAT_MESSAGE, onChatMessage);
      socket.off(EVENTS.ROUND_END, onRoundEnd);
      socket.off(EVENTS.GAME_OVER, onGameOver);
    };
  }, [socket]);

  // ACTIONS
  const createRoom = useCallback((hostName, avatar, settings) => {
    socket.emit(EVENTS.CREATE_ROOM, { hostName, avatar, settings });
  }, [socket]);

  const joinRoom = useCallback((roomId, playerName, avatar) => {
    socket.emit(EVENTS.JOIN_ROOM, { roomId, playerName, avatar });
  }, [socket]);

  const updateSettings = useCallback((settings) => {
    socket.emit(EVENTS.UPDATE_SETTINGS, { settings });
  }, [socket]);

  const startGame = useCallback(() => {
    socket.emit(EVENTS.START_GAME);
  }, [socket]);

  const chooseWord = useCallback((word) => {
    socket.emit(EVENTS.WORD_CHOSEN, { word });
    setShowWordModal(false);
  }, [socket]);

  const sendGuess = useCallback((text) => {
    if (!text.trim()) return;
    socket.emit(EVENTS.GUESS, { text });
  }, [socket]);

  const playAgain = useCallback(() => {
    socket.emit(EVENTS.PLAY_AGAIN);
  }, [socket]);

  const leaveRoom = useCallback(() => {
    setRoomState(null);
    setMyPlayer(null);
    setMessages([]);
    setRoundResult(null);
    setGameOverData(null);
  }, []);

  return {
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
    createRoom,
    joinRoom,
    updateSettings,
    startGame,
    chooseWord,
    sendGuess,
    playAgain,
    leaveRoom
  };
}
