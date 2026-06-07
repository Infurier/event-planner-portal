import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';
import {
  HiOutlineChatAlt2, HiOutlinePaperAirplane, HiOutlineArrowLeft,
  HiOutlineSearch, HiOutlineDotsVertical
} from 'react-icons/hi';

const Messages = () => {
  const { user } = useAuth();
  const { socket, decrementUnreadMessages } = useSocket();
  const [searchParams] = useSearchParams();
  const initialConvId = searchParams.get('conversation');

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (initialConvId && conversations.length > 0 && !activeConversation) {
      const conv = conversations.find(c => c.id === Number(initialConvId));
      if (conv) selectConversation(conv);
    }
  }, [initialConvId, conversations]);

  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = ({ message: msg, conversationId }) => {
      if (activeConversation && activeConversation.id === conversationId) {
        setMessages(prev => [...prev, msg]);
        setTimeout(scrollToBottom, 50);
        markConversationAsRead(conversationId);
      }

      setConversations(prev => {
        const updated = prev.map(c => {
          if (c.id === conversationId) {
            return {
              ...c,
              lastMessage: { content: msg.content, createdAt: msg.createdAt, senderId: msg.senderId || msg.sender?.id, isRead: activeConversation?.id === conversationId },
              lastMessageAt: msg.createdAt,
              unreadCount: activeConversation?.id === conversationId ? c.unreadCount : c.unreadCount + 1
            };
          }
          return c;
        });
        return updated.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
      });
    };

    socket.on('receive_message', handleReceiveMessage);
    return () => socket.off('receive_message', handleReceiveMessage);
  }, [socket, activeConversation, scrollToBottom]);

  const fetchConversations = async () => {
    try {
      const { data } = await API.get('/messages/conversations');
      setConversations(data.conversations || []);
    } catch {
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (conv) => {
    setActiveConversation(conv);
    setMessagesLoading(true);
    try {
      const { data } = await API.get(`/messages/conversations/${conv.id}/messages`);
      setMessages(data.messages || []);
      setTimeout(scrollToBottom, 100);

      if (conv.unreadCount > 0) {
        markConversationAsRead(conv.id);
        decrementUnreadMessages(conv.unreadCount);
        setConversations(prev => prev.map(c =>
          c.id === conv.id ? { ...c, unreadCount: 0 } : c
        ));
      }
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  };

  const markConversationAsRead = async (conversationId) => {
    try {
      await API.put(`/messages/conversations/${conversationId}/read`);
    } catch {}
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation || sending) return;

    setSending(true);
    try {
      const { data } = await API.post('/messages/send', {
        conversationId: activeConversation.id,
        content: newMessage.trim()
      });

      setMessages(prev => [...prev, data.message]);
      setNewMessage('');
      setTimeout(scrollToBottom, 50);

      setConversations(prev => {
        const updated = prev.map(c => {
          if (c.id === activeConversation.id) {
            return {
              ...c,
              lastMessage: { content: data.message.content, createdAt: data.message.createdAt, senderId: user.id, isRead: false },
              lastMessageAt: data.message.createdAt
            };
          }
          return c;
        });
        return updated.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
      });

      inputRef.current?.focus();
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const formatMessageTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDateSeparator = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const shouldShowDateSeparator = (messages, index) => {
    if (index === 0) return true;
    const current = new Date(messages[index].createdAt).toDateString();
    const prev = new Date(messages[index - 1].createdAt).toDateString();
    return current !== prev;
  };

  const filteredConversations = conversations.filter(c => {
    if (!searchQuery) return true;
    const name = c.otherUser?.businessName || c.otherUser?.name || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getInitial = (conv) => {
    return (conv.otherUser?.businessName || conv.otherUser?.name || '?').charAt(0).toUpperCase();
  };

  const getDisplayName = (conv) => {
    return conv.otherUser?.businessName || conv.otherUser?.name || 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-sm border border-dark-100 overflow-hidden">

      {/* Left: Conversation List */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-dark-100 flex flex-col flex-shrink-0 ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="p-4 border-b border-dark-100">
          <h1 className="text-xl font-bold text-dark-900 mb-3 flex items-center gap-2">
            <HiOutlineChatAlt2 className="text-primary-500" size={24} />
            Messages
          </h1>
          <div className="relative">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={18} />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2.5 bg-dark-50 border border-dark-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Conversation Items */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <div className="w-16 h-16 bg-dark-100 rounded-full flex items-center justify-center mb-4">
                <HiOutlineChatAlt2 className="text-dark-400" size={32} />
              </div>
              <p className="text-dark-500 font-medium">No conversations yet</p>
              <p className="text-dark-400 text-sm mt-1">Start chatting with a vendor from their profile page</p>
            </div>
          ) : (
            filteredConversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv)}
                className={`w-full flex items-center gap-3 p-4 hover:bg-dark-50 transition-colors text-left border-b border-dark-50 ${
                  activeConversation?.id === conv.id ? 'bg-primary-50 border-l-4 border-l-primary-500' : ''
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {conv.otherUser?.avatar ? (
                    <img
                      src={conv.otherUser.avatar.startsWith('http') ? conv.otherUser.avatar : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${conv.otherUser.avatar}`}
                      alt={getDisplayName(conv)}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-accent-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {getInitial(conv)}
                    </div>
                  )}
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                      {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-bold text-dark-900' : 'font-medium text-dark-800'}`}>
                      {getDisplayName(conv)}
                    </span>
                    <span className="text-[11px] text-dark-400 flex-shrink-0 ml-2">
                      {conv.lastMessage ? formatTime(conv.lastMessage.createdAt || conv.lastMessageAt) : ''}
                    </span>
                  </div>
                  <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'font-semibold text-dark-700' : 'text-dark-400'}`}>
                    {conv.lastMessage
                      ? `${conv.lastMessage.senderId === user.id ? 'You: ' : ''}${conv.lastMessage.content}`
                      : 'No messages yet'
                    }
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right: Chat Area */}
      <div className={`flex-1 flex flex-col ${!activeConversation ? 'hidden md:flex' : 'flex'}`}>
        {!activeConversation ? (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full flex items-center justify-center mb-6">
              <HiOutlineChatAlt2 className="text-primary-500" size={48} />
            </div>
            <h2 className="text-2xl font-bold text-dark-900 mb-2">Your Messages</h2>
            <p className="text-dark-400 max-w-md">
              Select a conversation to start chatting, or message a vendor from their profile page.
            </p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 p-4 border-b border-dark-100 bg-white">
              <button
                onClick={() => setActiveConversation(null)}
                className="md:hidden p-2 text-dark-500 hover:text-dark-700 hover:bg-dark-100 rounded-xl transition-colors"
              >
                <HiOutlineArrowLeft size={20} />
              </button>
              {activeConversation.otherUser?.avatar ? (
                <img
                  src={activeConversation.otherUser.avatar.startsWith('http') ? activeConversation.otherUser.avatar : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${activeConversation.otherUser.avatar}`}
                  alt={getDisplayName(activeConversation)}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-accent-500 rounded-full flex items-center justify-center text-white font-bold">
                  {getInitial(activeConversation)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-dark-900 truncate">{getDisplayName(activeConversation)}</p>
                <p className="text-xs text-dark-400">{activeConversation.otherUser?.email}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-dark-50/50">
              {messagesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin w-6 h-6 border-3 border-primary-500 border-t-transparent rounded-full"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-dark-400 text-sm">No messages yet. Say hello! 👋</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isSender = msg.senderId === user.id || msg.sender?.id === user.id;
                  return (
                    <div key={msg.id || idx}>
                      {shouldShowDateSeparator(messages, idx) && (
                        <div className="flex items-center justify-center my-4">
                          <div className="bg-dark-200/60 text-dark-500 text-[11px] font-medium px-3 py-1 rounded-full">
                            {getDateSeparator(msg.createdAt)}
                          </div>
                        </div>
                      )}
                      <div className={`flex ${isSender ? 'justify-end' : 'justify-start'} mb-2`}>
                        <div className={`max-w-[75%] lg:max-w-[60%] ${
                          isSender
                            ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-2xl rounded-br-md'
                            : 'bg-white text-dark-800 rounded-2xl rounded-bl-md shadow-sm border border-dark-100'
                        } px-4 py-2.5`}>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                          <p className={`text-[10px] mt-1 text-right ${isSender ? 'text-white/60' : 'text-dark-400'}`}>
                            {formatMessageTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-dark-100 bg-white">
              <div className="flex items-center gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 bg-dark-50 border border-dark-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 transition-all"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  disabled={sending}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="w-11 h-11 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-xl flex items-center justify-center hover:from-primary-600 hover:to-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                >
                  <HiOutlinePaperAirplane size={20} className="rotate-90" />
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Messages;
