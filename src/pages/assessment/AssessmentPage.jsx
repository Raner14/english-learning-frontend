import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { startAssessment, sendAssessmentMessage, endAssessment } from '../../services/assessmentService';
import PlaceholderView from '../../components/common/PlaceholderView';
import './AssessmentPage.css';

const LEVEL_COLOR = {
  Beginner: 'level--beginner',
  Intermediate: 'level--intermediate',
  Advanced: 'level--advanced',
};

// 'idle' | 'active' | 'ended'
function AssessmentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [phase, setPhase] = useState('idle');
  const [assessmentId, setAssessmentId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [ending, setEnding] = useState(false);
  const [result, setResult] = useState(null); // { detectedLevel, message }
  const [error, setError] = useState('');

  const messagesEndRef = useRef(null);

  // Must be before any conditional return — React Rules of Hooks
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Student-only
  if (user?.role !== 'student') {
    return <PlaceholderView title="Assessment" />;
  }

  async function handleStart() {
    setError('');
    try {
      const data = await startAssessment();
      setAssessmentId(data.assessmentId);
      // The first AI prompt comes back in data.messages[0]
      const firstMsg = data.messages?.[0];
      setMessages(firstMsg ? [{ role: 'ai', content: firstMsg.content }] : []);
      setPhase('active');
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Could not start the assessment.');
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    const content = inputText.trim();
    if (!content || sending) return;

    setMessages((prev) => [...prev, { role: 'user', content }]);
    setInputText('');
    setSending(true);
    setError('');

    try {
      const data = await sendAssessmentMessage(assessmentId, content);
      setMessages((prev) => [...prev, { role: 'ai', content: data.reply }]);
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  }

  async function handleEnd() {
    setEnding(true);
    setError('');
    try {
      const data = await endAssessment(assessmentId);
      setResult({ detectedLevel: data.detectedLevel, message: data.message });
      setPhase('ended');
    } catch (err) {
      setError(err?.response?.data?.error?.message || 'Failed to complete the assessment.');
    } finally {
      setEnding(false);
    }
  }

  const levelClass = LEVEL_COLOR[result?.detectedLevel] || '';

  return (
    <div className="assessment-page">
      <h1 className="assessment-page__title">Level Assessment</h1>
      <p className="assessment-page__subtitle">
        Have a short conversation with our AI to determine your current English level.
      </p>

      {/* Result card */}
      {phase === 'ended' && result && (
        <div className={`assessment-result ${levelClass}`}>
          <p className="assessment-result__label">Your English Level</p>
          <p className="assessment-result__level">{result.detectedLevel}</p>
          <p className="assessment-result__message">{result.message}</p>
          <div className="assessment-result__actions">
            <button
              type="button"
              className="assessment-result__btn"
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </button>
            <button
              type="button"
              className="assessment-result__btn assessment-result__btn--outline"
              onClick={() => navigate('/lessons')}
            >
              Browse Lessons
            </button>
          </div>
        </div>
      )}

      {/* Chat */}
      {phase !== 'ended' && (
        <div className="assessment-chat">
          <div className="assessment-chat__window">
            {phase === 'idle' && (
              <p className="assessment-chat__prompt">
                Press <strong>Start Assessment</strong> to begin. The AI will ask you a few
                questions to gauge your English proficiency.
              </p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg chat-msg--${msg.role}`}>
                <p className="chat-msg__bubble">{msg.content}</p>
              </div>
            ))}
            {sending && (
              <div className="chat-msg chat-msg--ai">
                <p className="chat-msg__bubble chat-msg__bubble--thinking">…</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {error && <p className="assessment-chat__error">{error}</p>}

          {phase === 'idle' && (
            <button type="button" className="assessment-page__start-btn" onClick={handleStart}>
              Start Assessment
            </button>
          )}

          {phase === 'active' && (
            <div className="assessment-chat__controls">
              <form className="assessment-chat__input-row" onSubmit={handleSend}>
                <input
                  type="text"
                  className="assessment-chat__input"
                  placeholder="Type your answer…"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={sending}
                  autoFocus
                />
                <button
                  type="submit"
                  className="assessment-chat__send"
                  disabled={!inputText.trim() || sending}
                >
                  Send
                </button>
              </form>
              <button
                type="button"
                className="assessment-page__end-btn"
                onClick={handleEnd}
                disabled={ending || messages.length < 3}
              >
                {ending ? 'Finishing…' : 'Finish Assessment'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AssessmentPage;
