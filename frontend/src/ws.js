const API = "http://localhost:8000/api";

async function jget(path) {
  const res = await fetch(`${API}${path}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || `GET ${path} failed`);
  return data;
}

async function jpost(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || `POST ${path} failed`);
  return data;
}

export const api = {
  field: (limit = 50) => jget(`/field?limit=${limit}`),
  join: (userId, name) => jpost("/join", { userId, name }),
  state: () => jget("/state"),
  startDraft: (userId, cfg) => jpost("/draft/start", { userId, ...cfg }),
  resetDraft: (userId) => jpost("/draft/reset", { userId }),
  pick: (userId, athleteId, name) => jpost("/draft/pick", { userId, athlete_id: athleteId, name }),
  playerHoles: (athleteId) => jget(`/player/${athleteId}/holes`),
};

export function connectWS(userId, onMessage) {
  const ws = new WebSocket(`ws://127.0.0.1:8000/ws?userId=${encodeURIComponent(userId)}`);

  ws.onopen = () => {
    console.log("WebSocket connected");
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (onMessage) onMessage(msg);
  };

  ws.onclose = () => {
    console.log("WebSocket disconnected");
  };

  ws.onerror = (err) => {
    console.error("WebSocket error:", err);
  };

  return ws;
}