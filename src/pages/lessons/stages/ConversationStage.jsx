import { useState, useEffect, useRef } from 'react';
import { startConversation, sendMessage, endConversation } from '../../../services/conversationService';
import './ConversationStage.css';

function ConversationStage({ lesson, vocab, onEnd, onBack }) {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [toUseWords, setToUseWords] = useState([]);
  const [usedWords, setUsedWords] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [ending, setEnding] = useState(false);
  const [starting, setStarting] = useState(true);
  const [error, setError] = useState('');
  const [inputError, setInputError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    startConversation(Number(lesson.lessonId))
      .then((data) => {
        setConversationId(data.conversationId);
        setToUseWords(data.unusedVocab || []);
        // Use the AI-generated opening message when available; fall back to hardcoded greeting
        // when AI is not yet configured (backend returns an empty messages array)
        const firstMsg = data.messages?.[0];
        setMessages([{
          role: 'ai',
          content: firstMsg?.content || `Hi! I'm your ${lesson.aiRole || 'AI partner'}. ${lesson.scene || ''} Let's begin!`,
        }]);
      })
      .catch((err) => {
        setError(err?.response?.data?.error?.message || 'Could not start the conversation.');
      })
      .finally(() => setStarting(false));
  }, [lesson.lessonId, lesson.aiRole, lesson.scene]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    const content = inputText.trim();
    if (!content) {
      setInputError('Please type a message before sending.');
      return;
    }
    if (sending || !conversationId) return;

    setInputError('');
    setMessages((prev) => [...prev, { role: 'user', content }]);
    setInputText('');
    setSending(true);
    setError('');

    try {
      const data = await sendMessage(conversationId, content);
      setMessages((prev) => [...prev, { role: 'ai', content: data.reply }]);

      const newUnused = data.unusedVocab || [];
      const justUsed = toUseWords.filter((w) => !newUnused.includes(w));
      if (justUsed.length > 0) {
        setUsedWords((prev) => [...prev, ...justUsed]);
      }
      setToUseWords(newUnused);
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  }

  async function handleEnd() {
    if (!conversationId) return;
    setEnding(true);
    setError('');
    try {
      const data = await endConversation(conversationId);
      onEnd(data.aiScore, data.aiFeedback);
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Failed to end the lesson.');
      setEnding(false);
    }
  }

  if (starting) {
    return (
      <div className="conv-stage conv-stage--loading">
        <p className="conv-stage__loading-text">Starting conversation…</p>
      </div>
    );
  }

  return (
    <div className="conv-stage">
      <div className="conv-stage__topbar">
        <button type="button" className="conv-stage__back-btn" onClick={onBack}>
          ← Grammar Warm-Up
        </button>
        <span className="conv-stage__ai-label">
          AI as: <strong>{lesson?.aiRole}</strong>
        </span>
      </div>

      <div className="conv-stage__body">
        {/* Chat panel */}
        <div className="conv-chat">
          <div className="conv-chat__window">
            {messages.map((msg, i) => (
              <div key={i} className={`conv-msg conv-msg--${msg.role}`}>
                <p className="conv-msg__bubble">{msg.content}</p>
              </div>
            ))}
            {sending && (
              <div className="conv-msg conv-msg--ai">
                <p className="conv-msg__bubble conv-msg__bubble--thinking">…</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {error && <p className="conv-stage__error">{error}</p>}

          <form className="conv-chat__input-row" onSubmit={handleSend}>
            <input
              type="text"
              className="conv-chat__input"
              placeholder="Type your message…"
              value={inputText}
              onChange={(e) => { setInputText(e.target.value); setInputError(''); }}
              disabled={sending || !conversationId}
              autoFocus
            />
            <button
              type="submit"
              className="conv-chat__send-btn"
              disabled={sending || !conversationId}
            >
              Send
            </button>
          </form>
          {inputError && <p className="conv-stage__input-error">{inputError}</p>}

          <button
            type="button"
            className="conv-chat__end-btn"
            onClick={handleEnd}
            disabled={ending || messages.length < 2}
          >
            {ending ? 'Finishing…' : 'Finish Lesson'}
          </button>
        </div>

        {/* Vocab tracker sidebar */}
        <aside className="conv-vocab">
          <div className="conv-vocab__section">
            <p className="conv-vocab__heading">Vocabulary to Use</p>
            {toUseWords.length === 0 ? (
              <p className="conv-vocab__all-done">All words used! 🎉</p>
            ) : (
              <div className="conv-vocab__chips">
                {toUseWords.map((word) => (
                  <span key={word} className="conv-vocab__chip">{word}</span>
                ))}
              </div>
            )}
          </div>

          {usedWords.length > 0 && (
            <div className="conv-vocab__section">
              <p className="conv-vocab__heading conv-vocab__heading--used">Words You've Used ✓</p>
              <div className="conv-vocab__chips">
                {usedWords.map((word) => (
                  <span key={word} className="conv-vocab__chip conv-vocab__chip--used">{word}</span>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default ConversationStage;
