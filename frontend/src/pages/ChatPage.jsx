import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Plus, Send, Hash, Trash2, X } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from '../components/UI/Spinner';

const AVATAR_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899'];
function getColor(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function initials(name = '') { return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(); }

function formatTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  return isToday
    ? d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('ro-RO', { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatPage() {
  const { user: me } = useAuth();
  const [channels, setChannels] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newChan, setNewChan] = useState(false);
  const [newChanName, setNewChanName] = useState('');
  const bottomRef = useRef();
  const lastTs = useRef(null);
  const pollRef = useRef();

  // Load channels
  useEffect(() => {
    api.get('/chat/channels').then(r => {
      setChannels(r.data);
      if (r.data.length > 0) setActive(r.data[0]);
      setLoading(false);
    });
  }, []);

  // Load messages when channel changes
  useEffect(() => {
    if (!active) return;
    lastTs.current = null;
    setMessages([]);
    api.get(`/chat/channels/${active.id}/messages`).then(r => {
      setMessages(r.data);
      if (r.data.length > 0) lastTs.current = r.data[r.data.length - 1].created_at;
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'instant' }), 50);
    });
  }, [active?.id]);

  // Polling for new messages
  const poll = useCallback(async () => {
    if (!active) return;
    const since = lastTs.current;
    if (!since) return;
    const r = await api.get(`/chat/channels/${active.id}/messages?since=${encodeURIComponent(since)}`);
    if (r.data.length > 0) {
      setMessages(prev => [...prev, ...r.data]);
      lastTs.current = r.data[r.data.length - 1].created_at;
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }, [active?.id]);

  useEffect(() => {
    pollRef.current = setInterval(poll, 3000);
    return () => clearInterval(pollRef.current);
  }, [poll]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || !active || sending) return;
    setSending(true);
    const res = await api.post(`/chat/channels/${active.id}/messages`, { text });
    setMessages(prev => [...prev, res.data]);
    lastTs.current = res.data.created_at;
    setText('');
    setSending(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const createChannel = async () => {
    if (!newChanName.trim()) return;
    const res = await api.post('/chat/channels', { name: newChanName });
    setChannels(prev => [...prev, res.data]);
    setActive(res.data);
    setNewChanName(''); setNewChan(false);
  };

  const deleteChannel = async (id) => {
    if (!confirm('Ștergi canalul?')) return;
    await api.delete(`/chat/channels/${id}`);
    const remaining = channels.filter(c => c.id !== id);
    setChannels(remaining);
    setActive(remaining.length > 0 ? remaining[0] : null);
  };

  if (loading) return <div className="page-loading"><Spinner /></div>;

  // Group consecutive messages from same user
  const grouped = messages.reduce((acc, msg, i) => {
    const prev = messages[i - 1];
    const sameUser = prev && prev.user_id === msg.user_id &&
      (new Date(msg.created_at) - new Date(prev.created_at)) < 5 * 60 * 1000;
    acc.push({ ...msg, grouped: sameUser });
    return acc;
  }, []);

  return (
    <div className="chat-layout">
      {/* Sidebar */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <span><MessageSquare size={15} /> Canale</span>
          <button className="btn-icon" onClick={() => setNewChan(true)} title="Canal nou"><Plus size={15} /></button>
        </div>
        {newChan && (
          <div className="chan-new">
            <Hash size={13} />
            <input autoFocus value={newChanName} onChange={e => setNewChanName(e.target.value)}
              placeholder="nume-canal" onKeyDown={e => { if (e.key === 'Enter') createChannel(); if (e.key === 'Escape') setNewChan(false); }} />
            <button onClick={createChannel}><Plus size={13} /></button>
            <button onClick={() => setNewChan(false)}><X size={13} /></button>
          </div>
        )}
        <div className="chan-list">
          {channels.length === 0 && <div className="chan-empty">Niciun canal. Creează primul!</div>}
          {channels.map(ch => (
            <div key={ch.id} className={`chan-item ${active?.id === ch.id ? 'active' : ''}`}
              onClick={() => setActive(ch)}>
              <Hash size={13} />
              <span>{ch.name}</span>
              {active?.id === ch.id && (
                <button className="chan-delete" onClick={e => { e.stopPropagation(); deleteChannel(ch.id); }}><Trash2 size={11} /></button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="chat-main">
        {!active ? (
          <div className="chat-empty">
            <MessageSquare size={48} />
            <p>Selectează sau creează un canal</p>
          </div>
        ) : (
          <>
            <div className="chat-header">
              <Hash size={16} />
              <span>{active.name}</span>
            </div>
            <div className="chat-messages">
              {grouped.length === 0 && (
                <div className="chat-no-msgs">Niciun mesaj. Fii primul!</div>
              )}
              {grouped.map(msg => {
                const isMe = msg.user_id === me?.id;
                const color = getColor(msg.user_name);
                const inits = initials(msg.user_name);
                return (
                  <div key={msg.id} className={`msg ${isMe ? 'msg-me' : ''} ${msg.grouped ? 'msg-grouped' : ''}`}>
                    {!msg.grouped && !isMe && (
                      <div className="msg-avatar" style={{ background: color + '22', color }}>{inits}</div>
                    )}
                    {msg.grouped && !isMe && <div className="msg-avatar-gap" />}
                    <div className="msg-content">
                      {!msg.grouped && (
                        <div className="msg-meta">
                          <span className="msg-name" style={{ color }}>{isMe ? 'Tu' : msg.user_name}</span>
                          <span className="msg-time">{formatTime(msg.created_at)}</span>
                        </div>
                      )}
                      <div className="msg-bubble">{msg.text}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <form className="chat-input-row" onSubmit={send}>
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={`Mesaj în #${active.name}...`}
                disabled={sending}
                autoComplete="off"
              />
              <button type="submit" className="chat-send" disabled={!text.trim() || sending}>
                <Send size={16} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
