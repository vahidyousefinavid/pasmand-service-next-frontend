'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Cookies from 'js-cookie';
import { Send, X, PhoneCall, Loader2, MessagesSquare } from 'lucide-react';

import { axiosService } from '@/lib/axiosService';
import { API } from '@/services/const';
import { C, S, alpha } from '@/components/ui/tokens';
import { Modal } from '@/components/ui/kit';

/**
 * The conversation about one pickup.
 *
 * Both apps talk to the same `/api/chat` endpoints and the same Message
 * collection, so what the collector writes here is what the citizen reads in
 * their history. The server decides who the two parties are from the request
 * itself, which is why nothing here sends an identity — a request id is not
 * enough to open somebody else's thread.
 *
 * Polling rather than a socket: this is a handful of lines about a pickup that
 * happens today, and a websocket on a PWA that spends its life backgrounded on
 * a phone costs more than it returns. Eight seconds is under the time it takes
 * to type a reply.
 */

const POLL_MS = 8000;

interface Message {
  _id: string;
  text: string;
  senderModel: 'User' | 'ServiceProvider';
  createdAt: string;
}

interface Contact {
  name: string;
  phone: string;
  role: 'citizen' | 'collector';
}

function authHeader() {
  const token = Cookies.get('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

function clock(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function RequestChat({
  requestId,
  onClose,
}: {
  requestId: string;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [contact, setContact] = useState<Contact | null>(null);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const bottomRef = useRef<HTMLDivElement>(null);
  // Only scroll when something new arrived, so a poll while the collector is
  // reading older lines does not yank the view down.
  const seenRef = useRef(0);

  const load = useCallback(
    (quiet = false) => {
      if (!quiet) setLoading(true);
      axiosService({
        url: API.CHAT_MESSAGES,
        method: 'get',
        params: { request: requestId },
        headers: authHeader(),
      })
        .then((res: any) => {
          setMessages(res?.data?.messages || []);
          setContact(res?.data?.contact || null);
          setError('');
        })
        .catch((err: any) => {
          setError(err?.data?.message || 'گفتگو باز نشد');
        })
        .finally(() => setLoading(false));
    },
    [requestId],
  );

  useEffect(() => {
    load();
    const id = setInterval(() => load(true), POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (messages.length !== seenRef.current) {
      seenRef.current = messages.length;
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  const send = () => {
    const text = draft.trim();
    if (!text || sending) return;

    setSending(true);
    axiosService({
      url: API.CHAT_MESSAGES,
      method: 'post',
      body: { request: requestId, text },
      headers: authHeader(),
    })
      .then((res: any) => {
        setMessages((prev) => [...prev, res.data.message]);
        setDraft('');
        setError('');
      })
      .catch((err: any) => setError(err?.data?.message || 'پیام ارسال نشد'))
      .finally(() => setSending(false));
  };

  return (
    <Modal onClose={onClose}>
      {/* ── who you are talking to, and how to phone them ────────────────── */}
      <div
        style={{
          position: 'sticky', top: 0, zIndex: 2,
          background: `linear-gradient(135deg, ${C.heroStart}, ${C.heroEnd})`,
          color: C.onHero,
          padding: `${S.s4}px ${S.s4}px`,
          display: 'flex', alignItems: 'center', gap: S.s3,
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="بستن گفتگو"
          style={{ background: 'rgba(255,255,255,0.16)', border: 'none', borderRadius: 12, color: 'inherit', padding: 8, cursor: 'pointer', display: 'grid', placeItems: 'center' }}
        >
          <X className="h-4 w-4" />
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: S.base, fontWeight: 800 }}>
            {contact?.name || 'گفتگو با شهروند'}
          </p>
          <p className="tnum" style={{ margin: '3px 0 0', fontSize: S.xs, color: C.onHeroMuted }} dir="ltr">
            {contact?.phone || '—'}
          </p>
        </div>

        {contact?.phone && (
          <a
            href={`tel:${contact.phone}`}
            aria-label="تماس تلفنی"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)',
              color: 'inherit', textDecoration: 'none',
              padding: '10px 14px', borderRadius: S.rPill, fontSize: S.xs, fontWeight: 800,
            }}
          >
            <PhoneCall className="h-4 w-4" />
            تماس
          </a>
        )}
      </div>

      {/* ── the thread ───────────────────────────────────────────────────── */}
      <div style={{ padding: S.s4, minHeight: 260, maxHeight: '52vh', overflowY: 'auto', background: C.bgSubtle }}>
        {loading ? (
          <p style={{ margin: 0, textAlign: 'center', color: C.muted, fontSize: S.sm, padding: S.s6 }}>
            <Loader2 className="h-4 w-4 animate-spin" style={{ display: 'inline-block' }} /> در حال بارگذاری…
          </p>
        ) : messages.length === 0 ? (
          <div style={{ display: 'grid', justifyItems: 'center', gap: S.s2, padding: `${S.s6}px ${S.s4}px`, textAlign: 'center' }}>
            <MessagesSquare className="h-8 w-8" style={{ color: C.subtle }} />
            <p style={{ margin: 0, fontSize: S.sm, fontWeight: 700, color: C.text }}>هنوز پیامی رد و بدل نشده</p>
            <p style={{ margin: 0, fontSize: S.xs, color: C.muted, lineHeight: 1.9, maxWidth: '34ch' }}>
              جزئیات آدرس، ساعت رسیدن یا حجم بار را همین‌جا بپرسید.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: S.s2 }}>
            {messages.map((m) => {
              const mine = m.senderModel === 'ServiceProvider';
              return (
                <div key={m._id} style={{ display: 'flex', justifyContent: mine ? 'flex-start' : 'flex-end' }}>
                  <div
                    style={{
                      maxWidth: '80%',
                      background: mine ? C.green : C.surface,
                      color: mine ? C.onAccent : C.text,
                      border: `1px solid ${mine ? C.green : C.border}`,
                      borderRadius: S.r2,
                      // The corner nearest the sender is squared off — the shape
                      // says who wrote it without a label on every line.
                      borderStartStartRadius: mine ? 6 : S.r2,
                      borderStartEndRadius: mine ? S.r2 : 6,
                      padding: `${S.s3}px ${S.s3}px ${S.s2}px`,
                      boxShadow: C.shadowCard,
                    }}
                  >
                    <p style={{ margin: 0, fontSize: S.sm, lineHeight: 1.9, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {m.text}
                    </p>
                    <p
                      className="tnum"
                      style={{
                        margin: '5px 0 0', fontSize: 10, textAlign: 'end',
                        color: mine ? 'rgba(255,255,255,0.75)' : C.subtle,
                      }}
                    >
                      {clock(m.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── composer ─────────────────────────────────────────────────────── */}
      <div style={{ padding: S.s3, borderTop: `1px solid ${C.border}`, background: C.surface }}>
        {error && (
          <p style={{ margin: `0 0 ${S.s2}px`, fontSize: S.xs, color: C.statusDanger, fontWeight: 700 }}>{error}</p>
        )}
        <div style={{ display: 'flex', gap: S.s2, alignItems: 'flex-end' }}>
          <textarea
            className="pm-field"
            rows={1}
            value={draft}
            maxLength={1000}
            placeholder="پیام خود را بنویسید…"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            style={{ minHeight: 48, maxHeight: 120, resize: 'none', flex: 1 }}
          />
          <button
            type="button"
            onClick={send}
            disabled={!draft.trim() || sending}
            aria-label="ارسال پیام"
            style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              display: 'grid', placeItems: 'center',
              background: draft.trim() ? C.green : alpha(C.green, 14),
              color: draft.trim() ? C.onAccent : C.green,
              border: 'none', cursor: draft.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </Modal>
  );
}
