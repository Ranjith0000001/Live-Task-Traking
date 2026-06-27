// frontend/src/hooks/useWebSocket.js

import { useState, useEffect, useCallback, useRef } from 'react';

const WS_URL = 'ws://localhost:5000/ws';

export function useWebSocket() {
    const [isConnected, setIsConnected] = useState(false);
    const [isReconnecting, setIsReconnecting] = useState(false); // new state
    const [lastMessage, setLastMessage] = useState(null);
    const [boardState, setBoardState] = useState({ todo: [], inprogress: [], done: [] });
    const [connectedUsers, setConnectedUsers] = useState([]);
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const localUserRef = useRef(null);

    const getLocalUser = () => {
        if (typeof window === "undefined") return null;
        const stored = window.localStorage.getItem("board_user");
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch {
                // ignore
            }
        }
        const user = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
            name: `User ${Math.floor(Math.random() * 9000) + 1000}`,
            color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`,
        };
        window.localStorage.setItem("board_user", JSON.stringify(user));
        return user;
    };

    // Connect to WebSocket
    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return; // Already connected
        }

        console.log('🔄 Connecting to WebSocket...');
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('✅ WebSocket connected');
            setIsConnected(true);
            setIsReconnecting(false);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('📨 Received:', data);
                setLastMessage(data);

                // Handle different message types
                switch (data.type) {
                    case 'USERS_UPDATE':
                        setConnectedUsers(data.payload || []);
                        break;
                    case 'INITIAL_STATE':
                        setBoardState(data.payload);
                        break;
                    case 'TASK_ADDED':
                        setBoardState(prev => {
                            const newState = { ...prev };
                            const task = data.payload.task;
                            newState[task.status] = [...newState[task.status], task];
                            return newState;
                        });
                        break;
                    case 'TASK_UPDATED':
                        setBoardState(prev => {
                            const newState = { ...prev };
                            const task = data.payload.task;
                            const oldStatus = data.payload.oldStatus;
                            const changedStatus = (data.payload.changes && data.payload.changes.status) || task.status;

                            // FIRST: remove this task from every column (defense against stale state)
                            Object.keys(newState).forEach(key => {
                                newState[key] = newState[key].filter(t => t.id !== task.id);
                            });

                            // SECOND: add it to the correct target column
                            if (!newState[changedStatus]) {
                                newState[changedStatus] = [];
                            }
                            newState[changedStatus] = [...newState[changedStatus], task];

                            return newState;
                        });
                        break;
                    case 'TASK_DELETED':
                        setBoardState(prev => {
                            const newState = { ...prev };
                            const taskId = data.payload.taskId;
                            // Remove from all columns
                            Object.keys(newState).forEach(key => {
                                newState[key] = newState[key].filter(t => t.id !== taskId);
                            });
                            return newState;
                        });
                        break;
                    default:
                        console.log('Unknown message type:', data.type);
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        ws.onclose = () => {
            console.log('❌ WebSocket disconnected');
            setIsConnected(false);
            setIsReconnecting(true);
            setConnectedUsers([]);

            // Auto-reconnect after 3 seconds
            reconnectTimeoutRef.current = setTimeout(() => {
                console.log('🔄 Attempting to reconnect...');
                connect();
            }, 3000);
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            ws.close();
        };

    }, []);

    // Send message to server
    const sendMessage = useCallback((data) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(data));
            return true;
        }
        console.warn('WebSocket not connected, cannot send message');
        return false;
    }, []);

    // Connect on mount
    useEffect(() => {
        connect();

        // Cleanup on unmount
        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [connect]);

    return {
        isConnected,
        isReconnecting,
        boardState,
        setBoardState, // Allow manual state updates
        lastMessage,
        connectedUsers,
        sendMessage,
        reconnect: connect
    };
}