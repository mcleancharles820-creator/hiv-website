import { useEffect, useRef, useState } from 'react';

function formatMessageTime(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function SupportGroupChat({ messages, viewerRole, memberAlias = '', busy = false, error = '', onSend, onRedact }) {
  const [draft, setDraft] = useState('');
  const listRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const nearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 100;
    if (nearBottom) list.scrollTop = list.scrollHeight;
  }, [messages]);

  const submitMessage = async (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;
    const result = await onSend(text);
    if (!result?.error) setDraft('');
  };

  const handleComposerKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  return (
    <section className="support-group-chat" aria-label="Live support group chat">
      <header className="support-group-chat-header">
        <div>
          <h2>Live group conversation</h2>
          <p>{viewerRole === 'supervisor' ? 'You are the designated health-worker supervisor.' : 'You are posting as your chosen alias.'}</p>
        </div>
        <span className="support-group-live"><i aria-hidden="true" /> Live</span>
      </header>
      <div className="support-group-message-list" ref={listRef} role="log" aria-live="polite" aria-relevant="additions text" aria-label="Group messages">
        {messages.length ? messages.map((message) => {
          const isSupervisorMessage = message.sender_role === 'supervisor';
          const isOwnMessage = viewerRole === 'member' && !isSupervisorMessage && message.sender_alias === memberAlias;
          return (
            <article className={`support-group-message ${isOwnMessage ? 'from-you' : ''} ${isSupervisorMessage ? 'from-supervisor' : ''}`} key={message.message_id}>
              <div className="support-group-message-meta">
                <strong>{isSupervisorMessage ? 'Health worker · Supervisor' : message.sender_alias}</strong>
                <time dateTime={message.sent_at}>{formatMessageTime(message.sent_at)}</time>
              </div>
              <p>{message.message_text}</p>
              {viewerRole === 'supervisor' && !message.is_redacted && (
                <button className="support-group-redact" type="button" onClick={() => onRedact(message.message_id)} aria-label={`Remove message from ${message.sender_alias}`}>
                  Remove message
                </button>
              )}
            </article>
          );
        }) : <p className="support-group-empty">No messages yet. Start the conversation.</p>}
      </div>
      {error && <p className="form-error support-group-error" role="alert">{error}</p>}
      <form className="support-group-composer" onSubmit={submitMessage} ref={formRef}>
        <label className="sr-only" htmlFor={`support-group-message-input-${viewerRole}`}>Write a message</label>
        <textarea
          id={`support-group-message-input-${viewerRole}`}
          value={draft}
          maxLength={2000}
          rows={2}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleComposerKeyDown}
          placeholder="Write a message…"
          disabled={busy}
          aria-describedby="support-group-compose-help"
        />
        <button className="primary-button" type="submit" disabled={busy || !draft.trim()}>
          {busy ? 'Sending…' : 'Send'} <span aria-hidden="true">↗</span>
        </button>
        <small id="support-group-compose-help">Enter to send · Shift+Enter for a new line · {draft.length}/2,000</small>
      </form>
    </section>
  );
}

export function PatientSupportGroupPanel({ group, membership, messages = [], localMode = false, onJoin, onLeave, onSend, onRefresh }) {
  const [alias, setAlias] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [stateReady, setStateReady] = useState(localMode || !onRefresh);
  const refreshRef = useRef(onRefresh);
  const canAccessGroup = Boolean(membership);

  useEffect(() => {
    refreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    if (localMode || !refreshRef.current) {
      setStateReady(true);
      return undefined;
    }
    let mounted = true;
    setStateReady(false);
    Promise.resolve(refreshRef.current()).then((result) => {
      if (mounted) {
        setStateReady(result !== false);
        if (result === false) setError('The group access check failed. Reload the page before opening this conversation.');
      }
    }).catch(() => {
      if (mounted) {
        setError('The group access check failed. Reload the page before opening this conversation.');
        setStateReady(false);
      }
    });
    return () => { mounted = false; };
  }, [group?.group_id, localMode]);

  useEffect(() => {
    if (!canAccessGroup || localMode) return undefined;
    const revalidate = () => {
      if (document.visibilityState !== 'visible') return;
      Promise.resolve(refreshRef.current?.()).then((result) => {
        if (result === false) setStateReady(false);
        else setStateReady(true);
      }).catch(() => setStateReady(false));
    };
    const interval = window.setInterval(revalidate, 5000);
    document.addEventListener('visibilitychange', revalidate);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', revalidate);
    };
  }, [canAccessGroup, localMode]);

  const runAction = async (action, ...args) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await action(...args);
      if (result?.error) setError(result.error);
      else return result;
    } catch {
      setError('The group could not be updated. Please try again.');
    } finally {
      setBusy(false);
    }
    return null;
  };

  const handleJoin = async (event) => {
    event.preventDefault();
    const result = await runAction(onJoin, alias.trim());
    if (result) {
      setAlias('');
      setNotice('You joined the group. Your alias is visible to other members.');
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Leave the support group? You will immediately lose access to its conversation and history.')) return;
    const result = await runAction(onLeave);
    if (result) setNotice('You left the group. Group history is no longer available to your account.');
  };

  if (!group) {
    return <p className="empty-records">The private support group is not available right now.</p>;
  }

  const hasSupervisor = Boolean(group.has_supervisor || group.facilitator_worker_id);
  return (
    <section className="support-group-panel" aria-labelledby="support-group-name">
      {localMode && <p className="support-group-local-warning" role="status">Demo mode only: group messages are not protected by server access controls here. Use the secure API deployment to join or read the conversation.</p>}
      <div className="support-group-overview">
        <div>
          <p className="eyebrow">One private community</p>
          <h2 id="support-group-name">{group.name}</h2>
          <p>{group.detail}</p>
        </div>
        <span className={`support-group-status ${hasSupervisor ? 'is-live' : ''}`}>
          <i aria-hidden="true" /> {hasSupervisor ? 'Supervisor assigned' : 'Not yet open'}
        </span>
      </div>
      <div className="support-group-privacy">
        <strong>Privacy, by design</strong>
        <p>Other members see your chosen alias, not your account name or email. Only current members and the designated health worker can read the conversation. Avoid sharing contact details or identifying health information in messages.</p>
      </div>
      {notice && <p className="form-status" role="status">{notice}</p>}
      {error && !membership && <p className="form-error" role="alert">{error}</p>}
      {!stateReady && <p className="support-group-unavailable" role="status">Checking current group access…</p>}
      {localMode ? <p className="empty-records">Group access is disabled in local-only mode.</p> : !stateReady ? null : membership ? (
        <>
          <div className="support-group-member-state">
            <p>Joined as <strong>{membership.display_alias}</strong></p>
            <button className="record-delete" type="button" onClick={handleLeave} disabled={busy}>{busy ? 'Leaving…' : 'Leave group'}</button>
          </div>
          {hasSupervisor
            ? <SupportGroupChat messages={messages} viewerRole="member" memberAlias={membership.display_alias} busy={busy} error={error} onSend={(text) => runAction(onSend, text)} />
            : <p className="support-group-unavailable" role="status">The group is paused until its verified health-worker supervisor is available. You may still leave at any time.</p>}
        </>
      ) : !hasSupervisor ? (
        <p className="support-group-unavailable" role="status">A verified, active health worker must be assigned by an administrator before members can join or chat.</p>
      ) : (
        <form className="support-group-join" onSubmit={handleJoin}>
          <label htmlFor="support-group-alias">Choose a display name</label>
          <input id="support-group-alias" type="text" required minLength={3} maxLength={24} pattern="[A-Za-z0-9_. -]{3,24}" value={alias} onChange={(event) => setAlias(event.target.value)} placeholder="e.g. RiverStone" aria-describedby="support-group-alias-help" />
          <small id="support-group-alias-help">Use an alias that does not identify you. Do not use your name, email, phone number, or other personal details. Alias must be 3–24 letters, numbers, spaces, periods, underscores, or hyphens.</small>
          <p>Joining is optional. You can leave at any time; after leaving, you cannot access the conversation or its history.</p>
          <button className="primary-button" type="submit" disabled={busy || !alias.trim()}>{busy ? 'Joining…' : 'Join group'} <span aria-hidden="true">↗</span></button>
        </form>
      )}
    </section>
  );
}

export function SupervisorSupportGroupPanel({ group, messages = [], localMode = false, onSend, onRedact, onRefresh }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [stateReady, setStateReady] = useState(localMode || !onRefresh);
  const isSupervisor = Boolean(group?.is_current_user_supervisor || (localMode && group?.facilitator_worker_id));
  const refreshRef = useRef(onRefresh);

  useEffect(() => {
    refreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    if (localMode || !refreshRef.current) {
      setStateReady(true);
      return undefined;
    }
    let mounted = true;
    setStateReady(false);
    Promise.resolve(refreshRef.current()).then((result) => {
      if (mounted) {
        setStateReady(result !== false);
        if (result === false) setError('The group access check failed. Reload the page before opening this conversation.');
      }
    }).catch(() => {
      if (mounted) {
        setError('The group access check failed. Reload the page before opening this conversation.');
        setStateReady(false);
      }
    });
    return () => { mounted = false; };
  }, [group?.group_id, localMode]);

  useEffect(() => {
    if (!isSupervisor || localMode) return undefined;
    const revalidate = () => {
      if (document.visibilityState !== 'visible') return;
      Promise.resolve(refreshRef.current?.()).then((result) => {
        if (result === false) setStateReady(false);
        else setStateReady(true);
      }).catch(() => setStateReady(false));
    };
    const interval = window.setInterval(revalidate, 5000);
    document.addEventListener('visibilitychange', revalidate);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', revalidate);
    };
  }, [isSupervisor, localMode]);

  const send = async (text) => {
    setError('');
    setBusy(true);
    try {
      const result = await onSend(text);
      if (result?.error) setError(result.error);
      return result;
    } catch {
      setError('The message could not be sent. Please try again.');
      return { error: 'send failed' };
    } finally {
      setBusy(false);
    }
  };

  const redact = async (messageId) => {
    if (!window.confirm('Remove this message from the group conversation?')) return;
    setError('');
    setBusy(true);
    try {
      const result = await onRedact(messageId);
      if (result?.error) setError(result.error);
    } catch {
      setError('The message could not be removed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (!group) return <p className="empty-records">No active support group is configured.</p>;
  if (localMode) return <p className="support-group-local-warning" role="status">Demo mode only: private group chat is disabled without the secure API.</p>;
  if (!stateReady) return <p className="support-group-unavailable" role="status">Checking current supervisor access…</p>;
  if (!isSupervisor) return <p className="support-group-unavailable" role="status">This group’s conversation is available only to its designated, verified health-worker supervisor.</p>;

  return (
    <section className="support-group-panel" aria-labelledby="supervisor-group-name">
      <div className="support-group-overview">
        <div><p className="eyebrow">Supervised community care</p><h2 id="supervisor-group-name">{group.name}</h2><p>Current member identities are not shown in this conversation. Posts are attributed by alias.</p></div>
        <span className="support-group-status is-live"><i aria-hidden="true" /> Supervisor</span>
      </div>
      <div className="support-group-privacy"><strong>Moderation responsibility</strong><p>Support the conversation, protect member privacy, and remove unsafe messages when needed. Removing a post replaces its text for current members and is recorded in the activity log.</p></div>
      <SupportGroupChat messages={messages} viewerRole="supervisor" busy={busy} error={error} onSend={send} onRedact={redact} />
    </section>
  );
}

export function AdminSupportGroupSupervisor({ group, eligibleWorkers, allWorkers, onAssign }) {
  const currentWorker = allWorkers.find((worker) => Number(worker.workerId) === Number(group?.facilitator_worker_id));
  const eligibleCurrentWorker = eligibleWorkers.some((worker) => Number(worker.workerId) === Number(group?.facilitator_worker_id));
  const [workerId, setWorkerId] = useState(group?.facilitator_worker_id && eligibleCurrentWorker ? String(group.facilitator_worker_id) : '');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setWorkerId(group?.facilitator_worker_id && eligibleCurrentWorker ? String(group.facilitator_worker_id) : '');
  }, [group?.facilitator_worker_id, eligibleCurrentWorker]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const result = await onAssign(workerId || null);
      if (result?.error) setError(result.error);
      else setNotice(workerId ? 'The group supervisor has been updated.' : 'Group access is paused until a supervisor is assigned.');
    } catch {
      setError('The supervisor assignment could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="support-group-panel" aria-labelledby="admin-support-group-name">
      <div className="support-group-overview">
        <div><p className="eyebrow">Single private community</p><h2 id="admin-support-group-name">{group?.name || 'Support group'}</h2><p>{group?.detail || 'One live, supervised support group for patients.'}</p></div>
        <span className={`support-group-status ${group?.has_supervisor ? 'is-live' : ''}`}><i aria-hidden="true" /> {group?.has_supervisor ? 'Supervisor assigned' : 'Access paused'}</span>
      </div>
      <p className="admin-note">Assigning a supervisor grants that verified health worker access to group messages. Administrators can manage this assignment but do not receive message content.</p>
      {!eligibleWorkers.length && <p className="support-group-unavailable">No verified, active, available, email-confirmed health workers are eligible right now.</p>}
      <form className="support-group-join" onSubmit={submit}>
        <label htmlFor="support-group-supervisor">Designated health-worker supervisor</label>
        <select id="support-group-supervisor" value={workerId} onChange={(event) => setWorkerId(event.target.value)}>
          <option value="">No supervisor — pause group access</option>
          {currentWorker && !eligibleCurrentWorker && <option value={String(currentWorker.workerId)} disabled>{currentWorker.fullName} — no longer eligible</option>}
          {eligibleWorkers.map((worker) => <option key={worker.workerId} value={String(worker.workerId)}>{worker.fullName} · {worker.specialty}</option>)}
        </select>
        <small>Only workers whose account is active, email confirmed, verified, and available can be assigned.</small>
        {error && <p className="form-error" role="alert">{error}</p>}
        {notice && <p className="form-status" role="status">{notice}</p>}
        <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save supervisor'} <span aria-hidden="true">↗</span></button>
      </form>
    </section>
  );
}
