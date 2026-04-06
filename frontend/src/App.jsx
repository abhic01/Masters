import { useEffect, useMemo, useState } from "react";
import { api } from "./api";
import { connectWS } from "./ws";

function uuid() {
  // Works on modern browsers
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();

  // Works on most browsers that have getRandomValues
  if (globalThis.crypto?.getRandomValues) {
    const a = new Uint8Array(16);
    globalThis.crypto.getRandomValues(a);
    a[6] = (a[6] & 0x0f) | 0x40;
    a[8] = (a[8] & 0x3f) | 0x80;
    const hex = [...a].map(b => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
  }

  // Last resort fallback
  return `uid-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getOrCreateUserId() {
  const key = "masters_userId";
  let v = localStorage.getItem(key);
  if (!v) {
    v = uuid();
    localStorage.setItem(key, v);
  }
  return v;
}

export default function App() {
  const userId = useMemo(() => getOrCreateUserId(), []);
  const [name, setName] = useState(localStorage.getItem("masters_name") || "");
  const [joined, setJoined] = useState(false);

  const [field, setField] = useState([]);
  const [room, setRoom] = useState(null);
  const [scoreboard, setScoreboard] = useState(null);

  const [query, setQuery] = useState("");
  const [holeModal, setHoleModal] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!joined) return;

    (async () => {
      const f = await api.field(50);
      setField(f.players || []);
    })();

    const ws = connectWS(userId, (msg) => {
      if (msg.type === "room_state") setRoom(msg.data);
      if (msg.type === "scoreboard") setScoreboard(msg.data);
      if (msg.type === "error") console.log("WS error:", msg.data);
    });

    return () => ws.close();
  }, [joined, userId]);

  const me = useMemo(() => {
    const users = room?.users || [];
    return users.find((u) => u.userId === userId) || null;
  }, [room, userId]);

  const draft = room?.draft;
  const picked = useMemo(() => new Set(draft?.picked || []), [draft]);

  const available = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (field || [])
      .filter((p) => !picked.has(p.athleteId))
      .filter((p) => (q ? p.name.toLowerCase().includes(q) : true));
  }, [field, picked, query]);

  const onClock = draft?.currentTeam;
  const isMyTurn = !!me && draft?.started && !draft?.completed && onClock === me.name;

  async function doJoin() {
    setError("");
    const nm = name.trim();
    if (!nm) {
      setError("Enter your name to join.");
      return;
    }
    localStorage.setItem("masters_name", nm);
    try {
      await api.join(userId, nm);
      setJoined(true);
    } catch (e) {
      setError(e.message);
    }
  }

  async function startDraft() {
    setError("");
    try {
      await api.startDraft(userId, {
        seconds_per_pick: 60,
        roster_size: 6,
        snake: true,
        auto_pick: true,
      });
    } catch (e) {
      setError(e.message);
    }
  }

  async function draftPlayer(player) {
    setError("");
    if (!isMyTurn) return;
    try {
      await api.pick(userId, player.athleteId, player.name);
    } catch (e) {
      setError(e.message);
    }
  }

  async function openHoles(athleteId, playerName) {
    const data = await api.playerHoles(athleteId);
    setHoleModal({ athleteId, name: playerName, ...data });
  }

  if (!joined) {
    return (
      <div className="page">
        <div className="card joinCard">
          <h1 className="h1">Join the Draft</h1>
          <p className="muted">Enter your name to enter the lobby. The host will start the draft.</p>

          <input
            className="input"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") doJoin(); }}
          />

          {error && <div className="error">{error}</div>}

          <button className="btn primary full" onClick={doJoin}>
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <h1 className="h1">Masters Draft Room</h1>
          <div className="muted">
            You are: <b>{me?.name || "…"}</b>{" "}
            {me?.isHost ? <span className="pillHost">HOST</span> : null}
            {" • "}
            {draft?.started
              ? draft.completed
                ? "Draft complete"
                : `On the clock: ${draft.currentTeam} • Pick ${draft.pickNo}/${draft.totalPicks} • ${draft.secondsLeft}s`
              : "Lobby (draft not started)"}
          </div>
        </div>

        <div className="actions">
          {me?.isHost && !draft?.started && (
            <button className="btn primary" onClick={startDraft}>
              Start Draft (Randomize Order)
            </button>
          )}
        </div>
      </header>

      {error && <div className="error" style={{ marginBottom: 10 }}>{error}</div>}

      <div className="layout">
        <section className="card">
          <h2 className="h2">Players in Lobby</h2>
          <div className="list lobbyList">
            {(room?.users || []).map((u) => (
              <div className="row" key={u.userId}>
                <div className="name">
                  {u.name} {u.isHost ? <span className="pillHost">HOST</span> : null}
                </div>
              </div>
            ))}
            {(room?.users || []).length === 0 && <div className="empty">No one yet.</div>}
          </div>

          <div className="sectionHeader">
            <h2 className="h2">Available (Top 50)</h2>
            <div className="pill">
              {draft?.started ? (isMyTurn ? "Your turn" : `Waiting: ${onClock}`) : "Waiting for host"}
            </div>
          </div>

          <input
            className="input"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <div className="list">
            {available.map((p) => (
              <div
                className={`row ${isMyTurn ? "clickable" : ""}`}
                key={p.athleteId}
                onClick={() => isMyTurn && draftPlayer(p)}
                title={isMyTurn ? "Click to draft" : "Not your turn"}
              >
                <div>
                  <div className="name">{p.name}</div>
                  <div className="meta">ID: {p.athleteId}</div>
                </div>
                <div className="pill">{isMyTurn ? "Draft" : "—"}</div>
              </div>
            ))}
            {available.length === 0 && <div className="empty">No available players.</div>}
          </div>
        </section>

        <section className="teams">
          {(draft?.teams || []).map((team) => {
            const roster = draft?.rosters?.[team] || [];
            const live = scoreboard?.teams?.[team];
            return (
              <div className="card" key={team}>
                <div className="teamHeader">
                  <h2 className="h2">{team}</h2>
                  <div className="total">Total: {live?.total ?? 0}</div>
                </div>

                <div className="list">
                  {roster.map((p) => {
                    const pts = live?.players?.find((x) => x.athleteId === p.athleteId)?.fantasyPoints ?? 0;
                    return (
                      <div className="row" key={p.athleteId}>
                        <div className="clickableName" onClick={() => openHoles(p.athleteId, p.name)}>
                          <div className="name">{p.name}</div>
                          <div className="meta">Click for holes</div>
                        </div>
                        <div className="pts">{pts}</div>
                      </div>
                    );
                  })}
                  {roster.length === 0 && <div className="empty">No picks yet.</div>}
                </div>
              </div>
            );
          })}
        </section>
      </div>

      <section className="card picksCard">
        <h2 className="h2">Pick History</h2>
        <div className="picks">
          {(draft?.picks || []).map((p) => (
            <div className="pick" key={`${p.pickNo}-${p.athleteId}`}>
              <div className="pickNo">#{p.pickNo}</div>
              <div className="pickBody">
                <div className="pickName">{p.name}</div>
                <div className="pickMeta">{p.team}</div>
              </div>
            </div>
          ))}
          {(draft?.picks || []).length === 0 && <div className="empty">No picks yet.</div>}
        </div>
      </section>

      {holeModal && (
        <div className="modalBackdrop" onClick={() => setHoleModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <div>
                <div className="modalTitle">{holeModal.name}</div>
                <div className="muted">Fantasy points: {holeModal.fantasyPoints ?? 0}</div>
              </div>
              <button className="btn" onClick={() => setHoleModal(null)}>Close</button>
            </div>

            <div className="holes">
              {(holeModal.holes || []).map((h) => (
                <div className="holeRow" key={`${h.round}-${h.hole}`}>
                  <div>R{h.round}</div>
                  <div>Hole {h.hole}</div>
                  <div>Par {h.par ?? "-"}</div>
                  <div>Strokes {h.strokes ?? "-"}</div>
                  <div className="pill">{h.result}</div>
                  <div className="pts">{h.points}</div>
                </div>
              ))}
              {(holeModal.holes || []).length === 0 && (
                <div className="empty">Hole-by-hole provider is currently stubbed.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}