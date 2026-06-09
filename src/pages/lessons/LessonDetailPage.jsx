import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLesson, getLessonGrammar, getLessonVocab } from '../../services/lessonService';
import { startConversation, sendMessage, endConversation } from '../../services/conversationService';
import PageLoader from '../../components/common/PageLoader';
import './LessonDetailPage.css';

// ── Sub-components ────────────────────────────────────────────────────────────

function LevelBadge({ level }) {
  const cls = {
    Beginner: 'lesson-detail__badge--beginner',
    Intermediate: 'lesson-detail__badge--intermediate',
    Advanced: 'lesson-detail__badge--advanced',
  }[level] || '';
  return <span className={`lesson-detail__badge ${cls}`}>{level}</span>;
}

function GrammarPanel({ grammar }) {
  if (!grammar) return null;
  const { grammarRuleId, category, usage, forms, examples } = grammar;
  return (
    <div className="lesson-detail__panel">
      <h3 className="lesson-detail__panel-title">Grammar</h3>
      <p className="lesson-detail__grammar-rule">{grammarRuleId?.replace(/_/g, ' ')}</p>
      {category && <p className="lesson-detail__grammar-category">{category}</p>}
      {usage && <p className="lesson-detail__grammar-usage">{usage}</p>}
      {forms && (
        <div className="lesson-detail__forms">
          {Object.entries(forms).map(([key, val]) => (
            <div key={key} className="lesson-detail__form-row">
              <span className="lesson-detail__form-key">{key.replace(/_/g, ' ')}</span>
              <span className="lesson-detail__form-val">{val}</span>
            </div>
          ))}
        </div>
      )}
      {examples?.length > 0 && (
        <div className="lesson-detail__examples">
          {examples.map((ex, i) => (
            <p key={i} className="lesson-detail__example">"{ex.text}"</p>
          ))}
        </div>
      )}
    </div>
  );
}

function VocabPanel({ vocab }) {
  if (!vocab?.length) return null;
  return (
    <div className="lesson-detail__panel">
      <h3 className="lesson-detail__panel-title">Vocabulary</h3>
      <div className="lesson-detail__vocab-list">
        {vocab.map((item) => (
          <div key={item.vocabularyId} className="lesson-detail__vocab-item">
            <span className="lesson-detail__vocab-word">{item.word}</span>
            <span className="lesson-detail__vocab-translation">{item.translation}</span>
            <p className="lesson-detail__vocab-def">{item.definition}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Chat ──────────────────────────────────────────────────────────────────────

function ChatMessage({ role, content }) {
  return (
    <div className={`chat__message chat__message--${role}`}>
      <p className="chat__bubble">{content}</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

function LessonDetailPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);
  const [grammar, setGrammar] = useState(null);
  const [vocab, setVocab] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [pageLoading, setPageLoading] = useState(true);

  // Conversation state
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unusedVocab, setUnusedVocab] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [ending, setEnding] = useState(false);
  const [result, setResult] = useState(null); // { aiScore, aiFeedback }
  const [chatError, setChatError] = useState('');

  // 'idle' | 'active' | 'ended'
  const [phase, setPhase] = useState('idle');

  const messagesEndRef = useRef(null);

  // Load lesson info, grammar, vocab in parallel
  useEffect(() => {
    Promise.all([
      getLesson(lessonId),
      getLessonGrammar(lessonId).catch(() => null),
      getLessonVocab(lessonId).catch(() => []),
    ])
      .then(([lessonData, grammarData, vocabData]) => {
        setLesson(lessonData);
        setGrammar(grammarData);
        setVocab(vocabData || []);
      })
      .catch((err) => setLoadError(err?.response?.data?.error?.message || 'Failed to load lesson.'))
      .finally(() => setPageLoading(false));
  }, [lessonId]);

  // Scroll chat to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleStart() {
    setChatError('');
    try {
      const data = await startConversation(Number(lessonId));
      setConversationId(data.conversationId);
      setUnusedVocab(data.unusedVocab || []);
      setMessages([{
        role: 'ai',
        content: `Hi! I'm your ${lesson?.aiRole || 'AI partner'}. ${lesson?.scene || ''} Let's begin!`,
      }]);
      setPhase('active');
    } catch (err) {
      setChatError(err?.response?.data?.error?.message || 'Could not start the conversation.');
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    const content = inputText.trim();
    if (!content || sending) return;

    setMessages((prev) => [...prev, { role: 'user', content }]);
    setInputText('');
    setSending(true);
    setChatError('');

    try {
      const data = await sendMessage(conversationId, content);
      setMessages((prev) => [...prev, { role: 'ai', content: data.reply }]);
      setUnusedVocab(data.unusedVocab || []);
    } catch (err) {
      setChatError(err?.response?.data?.error?.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  }

  async function handleEnd() {
    setEnding(true);
    setChatError('');
    try {
      const data = await endConversation(conversationId);
      setResult({ aiScore: data.aiScore, aiFeedback: data.aiFeedback });
      setPhase('ended');
    } catch (err) {
      setChatError(err?.response?.data?.error?.message || 'Failed to end the lesson.');
    } finally {
      setEnding(false);
    }
  }

  if (pageLoading) return <PageLoader text="Loading lesson…" />;

  if (loadError) {
    return (
      <div className="lesson-detail">
        <button type="button" className="lesson-detail__back" onClick={() => navigate('/lessons')}>
          ← Back to Lessons
        </button>
        <p className="lesson-detail__load-error">{loadError}</p>
      </div>
    );
  }

  const scoreClass = result?.aiScore >= 80 ? 'result--high' : result?.aiScore >= 60 ? 'result--mid' : 'result--low';

  return (
    <div className="lesson-detail">
      {/* Header */}
      <div className="lesson-detail__header">
        <button type="button" className="lesson-detail__back" onClick={() => navigate('/lessons')}>
          ← Back
        </button>
        <div className="lesson-detail__title-row">
          <h1 className="lesson-detail__title">{lesson?.title}</h1>
          <LevelBadge level={lesson?.level} />
        </div>
        <p className="lesson-detail__scene">{lesson?.scene}</p>
      </div>

      {/* Body: two columns */}
      <div className="lesson-detail__body">

        {/* Left: grammar + vocab */}
        <aside className="lesson-detail__sidebar">
          <GrammarPanel grammar={grammar} />
          <VocabPanel vocab={vocab} />
        </aside>

        {/* Right: conversation */}
        <section className="lesson-detail__conversation">

          {/* Result card (after ending) */}
          {phase === 'ended' && result && (
            <div className={`lesson-result ${scoreClass}`}>
              <p className="lesson-result__score">{result.aiScore}<span>/100</span></p>
              <p className="lesson-result__label">AI Score</p>
              <p className="lesson-result__feedback">"{result.aiFeedback}"</p>
              <button
                type="button"
                className="lesson-result__btn"
                onClick={() => navigate('/lessons')}
              >
                Back to Lessons
              </button>
            </div>
          )}

          {/* Chat window (idle or active) */}
          {phase !== 'ended' && (
            <>
              <div className="lesson-detail__chat-header">
                <span className="lesson-detail__ai-label">
                  AI as: <strong>{lesson?.aiRole}</strong>
                </span>
                {unusedVocab.length > 0 && phase === 'active' && (
                  <span className="lesson-detail__unused-vocab">
                    Try: {unusedVocab.join(', ')}
                  </span>
                )}
              </div>

              <div className="chat__window">
                {phase === 'idle' && (
                  <p className="chat__prompt">
                    Press <strong>Start Conversation</strong> to begin practising.
                  </p>
                )}
                {messages.map((msg, i) => (
                  <ChatMessage key={i} role={msg.role} content={msg.content} />
                ))}
                {sending && (
                  <div className="chat__message chat__message--ai">
                    <p className="chat__bubble chat__bubble--thinking">…</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {chatError && <p className="lesson-detail__chat-error">{chatError}</p>}

              {phase === 'idle' && (
                <button type="button" className="lesson-detail__start-btn" onClick={handleStart}>
                  Start Conversation
                </button>
              )}

              {phase === 'active' && (
                <div className="lesson-detail__chat-controls">
                  <form className="chat__input-row" onSubmit={handleSend}>
                    <input
                      type="text"
                      className="chat__input"
                      placeholder="Type your message…"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      disabled={sending}
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="chat__send-btn"
                      disabled={!inputText.trim() || sending}
                    >
                      Send
                    </button>
                  </form>
                  <button
                    type="button"
                    className="lesson-detail__end-btn"
                    onClick={handleEnd}
                    disabled={ending || messages.length < 2}
                  >
                    {ending ? 'Finishing…' : 'Finish Lesson'}
                  </button>
                </div>
              )}
            </>
          )}

        </section>
      </div>
    </div>
  );
}

export default LessonDetailPage;
