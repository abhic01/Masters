export function connectWS(userId, onMsg) {
  const WS_URL = `ws://${window.location.hostname}:8000/ws?userId=${encodeURIComponent(userId)}`;
  const ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    const t = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send("ping");
    }, 10000);
    ws._pingTimer = t;
  };

  ws.onmessage = (evt) => {
    try { onMsg(JSON.parse(evt.data)); } catch {}
  };

  ws.onclose = () => {
    if (ws._pingTimer) clearInterval(ws._pingTimer);
  };

  return ws;
}