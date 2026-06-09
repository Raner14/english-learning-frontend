import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLesson, getLessonGrammar, getLessonVocab, getLessonVocabWarmup, getLessonGrammarWarmup } from '../../services/lessonService';
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

  // 'idle' | 'vocab-warmup' | 'warmup' | 'active' | 'ended'
  const [phase, setPhase] = useState('idle');

  // Vocab warm-up state
  const [vocabExercises, setVocabExercises] = useState([]);
  const [vocabIndex, setVocabIndex] = useState(0);
  const [vocabSelected, setVocabSelected] = useState(null);
  const [vocabStarting, setVocabStarting] = useState(false);

  // Grammar warm-up state
  const [warmupExercises, setWarmupExercises] = useState([]);
  const [warmupIndex, setWarmupIndex] = useState(0);
  const [warmupSelected, setWarmupSelected] = useState(null);
  const [warmupLoading, setWarmupLoading] = useState(false);
  const [warmupStarting, setWarmupStarting] = useState(false);

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

  function buildVocabExercises(items) {
    return items.map((item) => {
      const distractors = items
        .filter((i) => i.vocabularyId !== item.vocabularyId)
        .map((i) => i.word)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      return { ...item, options: [item.word, ...distractors].sort(() => Math.random() - 0.5) };
    });
  }

  async function handleStartLesson() {
    setChatError('');
    setWarmupLoading(true);
    try {
      const [vocabData, grammarExercises] = await Promise.all([
        getLessonVocabWarmup(lessonId).catch(() => ({ completeSentence: [], matching: [] })),
        getLessonGrammarWarmup(lessonId).catch(() => []),
      ]);

      if (grammarExercises?.length > 0) {
        setWarmupExercises(grammarExercises);
        setWarmupIndex(0);
        setWarmupSelected(null);
      }

      const sentences = vocabData?.completeSentence || [];
      if (sentences.length > 0) {
        setVocabExercises(buildVocabExercises(sentences));
        setVocabIndex(0);
        setVocabSelected(null);
        setPhase('vocab-warmup');
      } else if (grammarExercises?.length > 0) {
        setPhase('warmup');
      } else {
        await handleStart();
      }
    } finally {
      setWarmupLoading(false);
    }
  }

  function handleVocabNext() {
    setVocabIndex((i) => i + 1);
    setVocabSelected(null);
  }

  async function handleVocabFinish() {
    if (warmupExercises.length > 0) {
      setPhase('warmup');
    } else {
      setVocabStarting(true);
      await handleStart();
      setVocabStarting(false);
    }
  }

  function handleWarmupNext() {
    setWarmupIndex((i) => i + 1);
    setWarmupSelected(null);
  }

  async function handleWarmupFinish() {
    setWarmupStarting(true);
    await handleStart();
    setWarmupStarting(false);
  }

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

          {/* Vocabulary warm-up */}
          {phase === 'vocab-warmup' && (() => {
            const ex = vocabExercises[vocabIndex];
            const isLast = vocabIndex === vocabExercises.length - 1;
            return (
              <div className="lesson-warmup lesson-warmup--vocab">
                <div className="lesson-warmup__header">
                  <span className="lesson-warmup__label lesson-warmup__label--vocab">Vocabulary Warm-Up</span>
                  <span className="lesson-warmup__progress">
                    {vocabIndex + 1} / {vocabExercises.length}
                  </span>
                </div>
                <div className="lesson-warmup__track">
                  <div
                    className="lesson-warmup__track-fill lesson-warmup__track-fill--vocab"
                    style={{ width: `${((vocabIndex + 1) / vocabExercises.length) * 100}%` }}
                  />
                </div>
                <div className="lesson-warmup__card">
                  <p className="lesson-warmup__instruction">Choose the correct word to complete the sentence</p>
                  <p className="lesson-warmup__content">{ex?.completeSentence}</p>
                  <div className="lesson-warmup__options">
                    {ex?.options?.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className={`lesson-warmup__option${vocabSelected === opt ? ' lesson-warmup__option--selected lesson-warmup__option--selected-vocab' : ''}`}
                        onClick={() => setVocabSelected(opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                {chatError && <p className="lesson-detail__chat-error">{chatError}</p>}
                <div className="lesson-warmup__footer">
                  {isLast ? (
                    <button
                      type="button"
                      className="lesson-detail__start-btn lesson-detail__start-btn--vocab"
                      onClick={handleVocabFinish}
                      disabled={!vocabSelected || vocabStarting}
                    >
                      {vocabStarting
                        ? 'Starting…'
                        : warmupExercises.length > 0
                        ? 'Grammar Warm-Up →'
                        : 'Start Conversation →'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="lesson-warmup__next-btn lesson-warmup__next-btn--vocab"
                      onClick={handleVocabNext}
                      disabled={!vocabSelected}
                    >
                      Next →
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Grammar warm-up quiz */}
          {phase === 'warmup' && (() => {
            const ex = warmupExercises[warmupIndex];
            const isLast = warmupIndex === warmupExercises.length - 1;
            return (
              <div className="lesson-warmup">
                <div className="lesson-warmup__header">
                  <span className="lesson-warmup__label">Warm-Up</span>
                  <span className="lesson-warmup__progress">
                    {warmupIndex + 1} / {warmupExercises.length}
                  </span>
                </div>
                <div className="lesson-warmup__track">
                  <div
                    className="lesson-warmup__track-fill"
                    style={{ width: `${((warmupIndex + 1) / warmupExercises.length) * 100}%` }}
                  />
                </div>
                <div className="lesson-warmup__card">
                  <p className="lesson-warmup__instruction">{ex?.instruction}</p>
                  <p className="lesson-warmup__content">{ex?.content}</p>
                  <div className="lesson-warmup__options">
                    {ex?.options?.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className={`lesson-warmup__option${warmupSelected === opt ? ' lesson-warmup__option--selected' : ''}`}
                        onClick={() => setWarmupSelected(opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                {chatError && <p className="lesson-detail__chat-error">{chatError}</p>}
                <div className="lesson-warmup__footer">
                  {isLast ? (
                    <button
                      type="button"
                      className="lesson-detail__start-btn"
                      onClick={handleWarmupFinish}
                      disabled={!warmupSelected || warmupStarting}
                    >
                      {warmupStarting ? 'Starting…' : 'Start Conversation →'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="lesson-warmup__next-btn"
                      onClick={handleWarmupNext}
                      disabled={!warmupSelected}
                    >
                      Next →
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Chat window (idle or active) */}
          {phase !== 'ended' && phase !== 'warmup' && phase !== 'vocab-warmup' && (
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
                <button
                  type="button"
                  className="lesson-detail__start-btn"
                  onClick={handleStartLesson}
                  disabled={warmupLoading}
                >
                  {warmupLoading ? 'Loading…' : 'Start Lesson'}
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
