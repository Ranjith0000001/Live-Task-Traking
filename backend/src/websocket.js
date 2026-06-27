// backend/websocket.js

const WebSocket = require('ws');

// Store all connected WebSocket clients
const clients = new Set();

// Store current board state (to send to new users)
let currentBoardState = { todo: [], inprogress: [], done: [] };

/**
 * Setup WebSocket server
 * @param {http.Server} server - HTTP server instance from app.js
 */
function setupWebSocket(server) {
    // Create WebSocket server attached to HTTP server
    const wss = new WebSocket.Server({ 
        server,
        path: '/ws'  // WebSocket will be available at: ws://localhost:5000/ws
    });

    console.log('🔌 WebSocket server initialized on path: /ws');

    // Handle new client connections
    wss.on('connection', (ws) => {
        console.log('👤 New WebSocket client connected');
        
        // Add client to our tracking set
        clients.add(ws);

        // Send current state to new client
        ws.send(JSON.stringify({
            type: 'INITIAL_STATE',
            payload: currentBoardState
        }));

        // Handle messages from this client
        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                console.log('📩 Received message:', data);
                // We'll handle messages in Step 4
            } catch (error) {
                console.error('Error parsing message:', error);
            }
        });

        // Handle client disconnection
        ws.on('close', () => {
            console.log('🔴 Client disconnected');
            clients.delete(ws);
        });

        // Handle errors
        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
            clients.delete(ws);
        });
    });

    return wss;
}


function broadcastUpdate(data) {
    const message = JSON.stringify(data);
    
    clients.forEach((client) => {
        // Only send to clients that are still connected
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}


function updateCurrentState(tasks) {
    currentBoardState = tasks;
}


function getCurrentState() {
    return currentBoardState;
}

module.exports = {
    setupWebSocket,
    broadcastUpdate,
    updateCurrentState,
    getCurrentState
};