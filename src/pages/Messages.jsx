import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import Avatar from '../components/Avatar.jsx';
import Button from '../components/Button.jsx';
import Icon from '../components/Icons.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import useAuth from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.jsx';
import { conversationsAPI } from '../services/api.js';
import { timeAgo, formatDateTime } from '../utils/helpers.js';

function formatMessageTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatMessageDateHeader(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  const today = new Date();
  const isToday =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  if (isToday) return 'Today';

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();
  if (isYesterday) return 'Yesterday';

  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Messages() {
  const { user } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobilePane, setMobilePane] = useState('list'); // 'list' | 'chat'

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Parse query params for initial conversation setup
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const queryConvoId = queryParams.get('conversationId');
  const queryRecipientId = queryParams.get('recipientId');
  const queryMatchId = queryParams.get('matchId');
  const queryClaimId = queryParams.get('claimId');
  const queryItemId = queryParams.get('itemId');

  const scrollToBottom = useCallback((smooth = true) => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  }, []);

  // Fetch all conversations
  const loadConversations = useCallback(
    async (selectId = null) => {
      try {
        const res = await conversationsAPI.list();
        if (res.success && Array.isArray(res.data)) {
          setConversations(res.data);

          if (selectId) {
            setActiveConversationId(selectId);
            setMobilePane('chat');
          } else if (!activeConversationId && res.data.length > 0 && !queryRecipientId && !queryConvoId) {
            // Select first on desktop if none selected
            if (window.innerWidth >= 768) {
              setActiveConversationId(res.data[0].id);
            }
          }
          return res.data;
        }
      } catch (err) {
        console.error('Failed to load conversations:', err);
      } finally {
        setLoadingList(false);
      }
      return [];
    },
    [activeConversationId, queryConvoId, queryRecipientId]
  );

  // Initialize or handle URL query params
  useEffect(() => {
    let isMounted = true;

    async function init() {
      setLoadingList(true);
      const list = await loadConversations();
      if (!isMounted) return;

      if (queryConvoId) {
        setActiveConversationId(queryConvoId);
        setMobilePane('chat');
      } else if (queryRecipientId) {
        // Find existing conversation with this recipient & context
        const existing = list.find((c) => {
          const hasRecipient = c.participants?.some(
            (p) => String(p.id || p._id) === String(queryRecipientId)
          );
          if (queryMatchId) {
            return hasRecipient && (String(c.matchId) === String(queryMatchId) || String(c.match?._id) === String(queryMatchId));
          }
          if (queryClaimId) {
            return hasRecipient && (String(c.claimId) === String(queryClaimId) || String(c.claim?._id) === String(queryClaimId));
          }
          return hasRecipient;
        });

        if (existing) {
          setActiveConversationId(existing.id);
          setMobilePane('chat');
        } else {
          // Create the conversation on the fly
          try {
            const createRes = await conversationsAPI.create({
              recipientId: queryRecipientId,
              matchId: queryMatchId || undefined,
              claimId: queryClaimId || undefined,
              itemId: queryItemId || undefined,
            });
            if (createRes.success && createRes.data) {
              const newConvo = createRes.data;
              setConversations((prev) => [newConvo, ...prev.filter((c) => c.id !== newConvo.id)]);
              setActiveConversationId(newConvo.id);
              setMobilePane('chat');
            }
          } catch (err) {
            toast.show({
              kind: 'error',
              title: 'Cannot start conversation',
              message: err.message || 'Users must be participants in a valid match or claim.',
            });
          }
        }
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [loadConversations, queryConvoId, queryRecipientId, queryMatchId, queryClaimId, queryItemId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load messages whenever activeConversationId changes
  const loadMessages = useCallback(
    async (convoId, silent = false) => {
      if (!convoId) {
        setMessages([]);
        return;
      }
      if (!silent) setLoadingMessages(true);

      try {
        const res = await conversationsAPI.getMessages(convoId);
        if (res.success && Array.isArray(res.data)) {
          setMessages(res.data);
          // Mark as read in local conversation state
          setConversations((prev) =>
            prev.map((c) => (c.id === convoId ? { ...c, unreadCount: 0 } : c))
          );
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        if (!silent) setLoadingMessages(false);
      }
    },
    []
  );

  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    }
  }, [activeConversationId, loadMessages]);

  // Scroll to bottom when messages load or change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom(false);
    }
  }, [messages.length, scrollToBottom]);

  // Polling for updates every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      if (activeConversationId) {
        loadMessages(activeConversationId, true);
      }
      conversationsAPI
        .list()
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setConversations(res.data);
          }
        })
        .catch(() => {});
    }, 4000);

    return () => clearInterval(timer);
  }, [activeConversationId, loadMessages]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) || null,
    [conversations, activeConversationId]
  );

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => {
      const name = c.otherUser?.name?.toLowerCase() || '';
      const title = c.contextTitle?.toLowerCase() || '';
      const last = c.lastMessage?.text?.toLowerCase() || '';
      return name.includes(q) || title.includes(q) || last.includes(q);
    });
  }, [conversations, searchQuery]);

  const totalUnread = useMemo(
    () => conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0),
    [conversations]
  );

  const handleSelectConversation = (id) => {
    setActiveConversationId(id);
    setMobilePane('chat');
    // Clear URL query parameters for clean URL
    if (location.search) {
      navigate('/messages', { replace: true });
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || !activeConversationId || sending) return;

    setSending(true);
    setInputText('');

    // Optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      conversationId: activeConversationId,
      senderId: user?.id,
      recipientId: activeConversation?.otherUser?.id,
      sender: { id: user?.id, name: user?.name },
      text,
      read: false,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    scrollToBottom(true);

    try {
      const res = await conversationsAPI.sendMessage(activeConversationId, { text });
      if (res.success && res.data) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? res.data : m))
        );
        // Update last message in conversation list
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversationId
              ? {
                  ...c,
                  lastMessage: { text, sender: user?.id, createdAt: res.data.createdAt },
                  updatedAt: res.data.createdAt,
                }
              : c
          )
        );
      }
    } catch (err) {
      toast.show({
        kind: 'error',
        title: 'Message not sent',
        message: err.message || 'Failed to deliver message.',
      });
      // Revert optimistic message
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInputText(text);
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups = [];
    let currentDate = null;

    messages.forEach((msg) => {
      const dateHeader = formatMessageDateHeader(msg.createdAt);
      if (dateHeader !== currentDate) {
        currentDate = dateHeader;
        groups.push({ type: 'header', label: dateHeader, id: `header-${dateHeader}-${msg.id}` });
      }
      groups.push({ type: 'message', data: msg, id: msg.id });
    });

    return groups;
  }, [messages]);

  return (
    <div className="page page--messages">
      <PageHeader
        eyebrow="Private Messaging"
        title="Messages"
        subtitle="Secure, direct communication between participants of matched items and verified claims."
        actions={
          totalUnread > 0 ? (
            <span className="badge badge--danger unread-total-badge">
              {totalUnread} unread message{totalUnread === 1 ? '' : 's'}
            </span>
          ) : null
        }
      />

      <div className={`chat-layout ${mobilePane === 'chat' ? 'chat-layout--mobile-chat' : ''}`}>
        {/* ===================== CONVERSATION LIST (SIDEBAR) ===================== */}
        <aside className="chat-sidebar">
          <div className="chat-sidebar__header">
            <div className="chat-search">
              <Icon name="search" size={15} className="chat-search__icon" />
              <input
                type="text"
                placeholder="Search conversations…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="chat-search__input"
                aria-label="Search conversations"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="chat-search__clear"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="chat-sidebar__list" role="tablist" aria-label="Conversation list">
            {loadingList ? (
              <div className="chat-sidebar__loading">
                <LoadingSpinner label="Loading chats…" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="chat-sidebar__empty">
                {searchQuery ? (
                  <p>No conversations match &ldquo;{searchQuery}&rdquo;.</p>
                ) : (
                  <div className="chat-sidebar__notice">
                    <div className="chat-notice-icon">
                      <Icon name="message" size={24} />
                    </div>
                    <strong>No conversations yet</strong>
                    <p>
                      Private chats can be started from eligible Smart Matches or related Claims.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/matches')}
                      icon="flame"
                    >
                      Browse Matches
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              filteredConversations.map((c) => {
                const isActive = c.id === activeConversationId;
                const other = c.otherUser || {};
                const isUnread = (c.unreadCount || 0) > 0;
                const lastText = c.lastMessage?.text || 'No messages yet';
                const isSentByMe = String(c.lastMessage?.sender) === String(user?.id);

                return (
                  <button
                    key={c.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`convo-item ${isActive ? 'is-active' : ''} ${isUnread ? 'is-unread' : ''}`}
                    onClick={() => handleSelectConversation(c.id)}
                  >
                    <div className="convo-item__avatar">
                      <Avatar name={other.name || 'User'} size={42} />
                      {isUnread && <span className="convo-item__dot" />}
                    </div>

                    <div className="convo-item__content">
                      <div className="convo-item__top">
                        <strong className="convo-item__name">{other.name || 'User'}</strong>
                        <span className="convo-item__time">
                          {c.lastMessage?.createdAt
                            ? timeAgo(c.lastMessage.createdAt)
                            : timeAgo(c.updatedAt)}
                        </span>
                      </div>

                      <div className="convo-item__context">
                        <span className={`convo-tag convo-tag--${c.contextType || 'match'}`}>
                          <Icon name={c.contextType === 'claim' ? 'claim' : 'flame'} size={11} />
                          {c.contextType === 'claim' ? 'Claim' : 'Match'}
                        </span>
                        <span className="convo-item__subject">
                          {c.contextTitle || 'Lost & Found pairing'}
                        </span>
                      </div>

                      <div className="convo-item__bottom">
                        <p className="convo-item__snippet">
                          {isSentByMe && <span className="convo-item__me">You: </span>}
                          {lastText}
                        </p>
                        {isUnread && (
                          <span className="badge badge--danger convo-item__unread-badge">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ===================== CHAT WINDOW (MAIN PANE) ===================== */}
        <main className="chat-window">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <header className="chat-header">
                <div className="chat-header__left">
                  <button
                    type="button"
                    className="icon-btn chat-header__back"
                    onClick={() => setMobilePane('list')}
                    aria-label="Back to conversations list"
                  >
                    <Icon name="arrowLeft" size={18} />
                  </button>

                  <Avatar name={activeConversation.otherUser?.name || 'User'} size={44} />

                  <div className="chat-header__user-meta">
                    <div className="chat-header__title-row">
                      <strong className="chat-header__name">
                        {activeConversation.otherUser?.name || 'Participant'}
                      </strong>
                      <span className="role-chip role-chip--sm">
                        {activeConversation.otherUser?.role === 'admin'
                          ? 'Admin'
                          : activeConversation.otherUser?.role === 'teacher'
                          ? 'Teacher'
                          : 'Student'}
                      </span>
                    </div>

                    <div className="chat-header__context-pill">
                      <Icon
                        name={activeConversation.contextType === 'claim' ? 'claim' : 'flame'}
                        size={12}
                      />
                      <span>
                        {activeConversation.contextType === 'claim'
                          ? `Claim Context: ${activeConversation.contextTitle || 'Item'}`
                          : `Matched: ${activeConversation.contextTitle || 'Smart Match'}`}
                      </span>
                      {activeConversation.itemId && (
                        <button
                          type="button"
                          className="chat-header__view-item"
                          onClick={() => navigate(`/item/${activeConversation.itemId}`)}
                        >
                          View Item
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="chat-header__right">
                  <span className="chat-status-indicator">
                    <span className="status-dot status-dot--online" />
                    <span>Private Channel</span>
                  </span>
                </div>
              </header>

              {/* Message Thread */}
              <div className="chat-thread" role="log" aria-live="polite">
                {loadingMessages ? (
                  <div className="chat-thread__loading">
                    <LoadingSpinner label="Loading conversation thread…" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="chat-thread__empty">
                    <div className="chat-empty-bubble">
                      <Icon name="message" size={28} />
                    </div>
                    <h4>Conversation Started</h4>
                    <p>
                      You are securely connected with{' '}
                      <strong>{activeConversation.otherUser?.name}</strong> regarding{' '}
                      <em>{activeConversation.contextTitle || 'your item'}</em>.
                    </p>
                    <p className="chat-empty-tip">
                      Tip: Confirm unique identifying marks, location details, and arrange a safe on-campus handover.
                    </p>
                  </div>
                ) : (
                  groupedMessages.map((item) => {
                    if (item.type === 'header') {
                      return (
                        <div key={item.id} className="chat-date-divider">
                          <span>{item.label}</span>
                        </div>
                      );
                    }

                    const msg = item.data;
                    const isMe = String(msg.senderId) === String(user?.id);

                    return (
                      <div
                        key={item.id}
                        className={`chat-bubble-row ${isMe ? 'chat-bubble-row--me' : 'chat-bubble-row--them'}`}
                      >
                        {!isMe && (
                          <Avatar
                            name={msg.sender?.name || activeConversation.otherUser?.name || 'User'}
                            size={28}
                            className="chat-bubble-avatar"
                          />
                        )}

                        <div className="chat-bubble-group">
                          {!isMe && (
                            <span className="chat-bubble-sender">
                              {msg.sender?.name || activeConversation.otherUser?.name}
                            </span>
                          )}

                          <div className={`chat-bubble ${isMe ? 'chat-bubble--me' : 'chat-bubble--them'}`}>
                            <p className="chat-bubble__text">{msg.text}</p>
                          </div>

                          <div className="chat-bubble-meta">
                            <span className="chat-bubble-time">{formatMessageTime(msg.createdAt)}</span>
                            {isMe && (
                              <span className="chat-bubble-status">
                                {msg.read ? 'Read ✓✓' : 'Sent ✓'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Footer */}
              <footer className="chat-footer">
                <form className="chat-form" onSubmit={handleSendMessage}>
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message ${activeConversation.otherUser?.name || 'user'}… (Press Enter to send)`}
                    className="chat-input"
                    disabled={sending}
                    aria-label="Type your message"
                  />
                  <button
                    type="submit"
                    className="btn btn--primary chat-send-btn"
                    disabled={!inputText.trim() || sending}
                    aria-label="Send message"
                  >
                    <Icon name="send" size={16} />
                    <span className="chat-send-btn__text">Send</span>
                  </button>
                </form>
              </footer>
            </>
          ) : (
            <div className="chat-placeholder">
              <div className="chat-placeholder__icon">
                <Icon name="message" size={48} />
              </div>
              <h3>Select a Conversation</h3>
              <p>
                Choose an existing chat from the left panel, or visit <strong>Smart Matches</strong> to message owners of matched reports.
              </p>
              <div className="chat-placeholder__actions">
                <Button variant="primary" icon="flame" onClick={() => navigate('/matches')}>
                  View Smart Matches
                </Button>
                <Button variant="outline" icon="claim" onClick={() => navigate('/claims')}>
                  View Claims
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
