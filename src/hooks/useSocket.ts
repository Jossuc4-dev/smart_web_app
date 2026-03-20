// src/hooks/useSocket.ts
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

let socketInstance: Socket | null = null;

/**
 * Retourne (et crée si nécessaire) la connexion Socket.IO singleton.
 * Appeler avec le token JWT de l'utilisateur connecté.
 */
export function getSocket(token: string): Socket {
  if (!socketInstance || !socketInstance.connected) {
    socketInstance = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
  }
  return socketInstance;
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

/**
 * Hook pour écouter un événement Socket.IO.
 *
 * @param token   - JWT de l'utilisateur
 * @param event   - Nom de l'événement à écouter (ex: "stock-alert")
 * @param handler - Callback appelé à chaque réception
 */
export function useSocketEvent<T = unknown>(
  token: string | null,
  event: string,
  handler: (data: T) => void
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler; // toujours à jour sans re-subscribe

  useEffect(() => {
    if (!token) return;

    const socket = getSocket(token);

    const listener = (data: T) => handlerRef.current(data);
    socket.on(event, listener);

    return () => {
      socket.off(event, listener);
    };
  }, [token, event]);
}