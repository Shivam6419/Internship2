// API service to interact with backend REST endpoints

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

/**
 * Pings backend health status
 * @returns {Promise<{status: string, message: string, timestamp: string}>}
 */
export async function checkHealth() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`);
    if (!res.ok) {
      throw new Error(`Health check failed with status ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching backend health:', error);
    return { status: 'offline', error: error.message };
  }
}

/**
 * Checks if a specific room code exists and is joinable
 * @param {string} roomId 
 * @returns {Promise<{exists: boolean, room?: object, message?: string}>}
 */
export async function checkRoomExists(roomId) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/rooms/${roomId}`);
    return await res.json();
  } catch (error) {
    console.error('Error verifying room existence:', error);
    return { exists: false, message: 'Server unreachable' };
  }
}

export { BACKEND_URL };
