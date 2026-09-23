import React, { createContext, useContext, useEffect, useState } from 'react';
import { socket, connectSocket, disconnectSocket } from '../services/socket';
import { EVENTS } from '../constants/events';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [socketId, setSocketId] = useState(socket.id || null);
  const [socketError, setSocketError] = useState(null);

  useEffect(() => {
    // Explicitly connect on mount
    connectSocket();

    const onConnect = () => {
      setIsConnected(true);
      setSocketId(socket.id);
      setSocketError(null);
      console.log('🟢 [SOCKET] Connected with ID:', socket.id);
    };

    const onDisconnect = (reason) => {
      setIsConnected(false);
      setSocketId(null);
      console.log('🔴 [SOCKET] Disconnected. Reason:', reason);
    };

    const onConnectError = (error) => {
      setSocketError(error.message);
      console.error('⚠️ [SOCKET] Connection Error:', error);
    };

    const onErrorNotification = (payload) => {
      console.warn('⚠️ [SOCKET] Error from server:', payload);
      setSocketError(payload?.message || 'Server error occurred');
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on(EVENTS.ERROR, onErrorNotification);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off(EVENTS.ERROR, onErrorNotification);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, socketId, socketError, setSocketError }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
