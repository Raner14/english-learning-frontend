import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getConversation, addTeacherComment, replyToConversation } from '../../services/conversationService';
import PageLoader from '../../components/common/PageLoader';
import './ConversationDetailPage.css';

function ChatMessage({ role, content }) {
  const isStudent = role === 'student';
  return (
    <div className={`conv-msg conv-msg--${isStudent ? 'student' : 'ai'}`}>
      <span className="conv-msg__label">{isStudent ? 'Student' : 'AI'}</span>
      <p className="conv-msg__bubble">{content}</p>
    </div>
  );
}

function ThreadMessage({ reply, isOwnMessage }) {
  return (
    <div className={`conv-thread__msg conv-thread__msg--${isOwnMessage ? 'own' : 'other'}`}>
      <span className="conv-thread__role">
        {isOwnMessage ? 'You' : reply.role === 'teacher' ? 'Teacher' : 'Student'}
      </span>
      <p className="conv-thread__bubble">{reply.content}</p>
    </div>
  );
}

function ConversationDetailPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Teacher review form
  const [teacherScore, setTeacherScore] = useState('');
  const [teacherComment, setTeacherComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Reply thread
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replyError, setReplyError] = useState('');

  const threadEndRef = useRef(null);

  useEffect(() => {
    getConversation(conversationId)
      .then((data) => {
        setConversation(data);
        setReplies(data.replies || []);
      })
      .catch((err) => setLoadError(err?.response?.data?.error?.message || 'Failed to load conversation.'))
      .finally(() => setLoading(false));
  }, [conversationId]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [replies]);

  async function handleSubmitReview(e) {
    e.preventDefault();
    const score = Number(teacherScore);
    if (!teacherScore || score < 0 || score > 100) {
      setSubmitError('Enter a score between 0 and 100.');
      return;
    }
    if (!teacherComment.trim()) {
      setSubmitError('Please write a comment.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    try {
      await addTeacherComment(conversationId, score, teacherComment.trim());
      setConversation((prev) => ({
        ...prev,
        teacherScore: score,
        teacherComment: teacherComment.trim(),
      }));
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err?.response?.data?.error?.message || 'Failed to save review.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReply(e) {
    e.preventDefault();
    const content = replyText.trim();
    if (!content) return;

    setReplySubmitting(true);
    setReplyError('');
    try {
      const data = await replyToConversation(conversationId, user.role, content);
      setReplies((prev) => [...prev, data.reply]);
      setReplyText('');
    } catch (err) {
      setReplyError(err?.response?.data?.error?.message || 'Failed to send reply.');
    } finally {
      setReplySubmitting(false);
    }
  }

  if (loading) return <PageLoader text="Loading conversation…" />;

  const isTeacher = user?.role === 'teacher';
  const backPath = isTeacher ? '/conversations' : '/progress';
  const backLabel = isTeacher ? '← Back to Conversations' : '← Back to My Progress';

  if (loadError) {
    return (
      <div className="conv-detail">
        <button type="button" className="conv-detail__back" onClick={() => navigate(backPath)}>
          {backLabel}
        </button>
        <p className="conv-detail__load-error">{loadError}</p>
      </div>
    );
  }

  const alreadyReviewed = conversation.teacherScore != null;
  const showThread = alreadyReviewed || submitted;

  return (
    <div className="conv-detail">
      <button type="button" className="conv-detail__back" onClick={() => navigate(backPath)}>
        {backLabel}
      </button>

      <div className="conv-detail__meta">
        {alreadyReviewed ? (
          <span className="conv-detail__status conv-detail__status--done">Reviewed</span>
        ) : (
          <span className="conv-detail__status conv-detail__status--pending">Awaiting Review</span>
        )}
        <span className="conv-detail__ai-score">AI Score: <strong>{conversation.aiScore ?? '—'}</strong></span>
      </div>

      {/* Conversation messages (read-only) */}
      <div className="conv-detail__messages">
        {conversation.messages?.length === 0 && (
          <p className="conv-detail__empty">No messages recorded.</p>
        )}
        {conversation.messages?.map((msg, i) => (
          <ChatMessage
            key={i}
            role={msg.role === 'assistant' ? 'ai' : msg.role}
            content={msg.content}
          />
        ))}
      </div>

      {/* Teacher: review form or existing review */}
      {isTeacher && (
        <div className="conv-detail__review-section">
          {(alreadyReviewed || submitted) ? (
            <div className="conv-detail__existing-review">
              <h3 className="conv-detail__review-heading">Your Review</h3>
              <p className="conv-detail__review-score">
                Score: <strong>{conversation.teacherScore}/100</strong>
              </p>
              <p className="conv-detail__review-comment">"{conversation.teacherComment}"</p>
              {submitted && (
                <p className="conv-detail__save-success">Review saved successfully.</p>
              )}
            </div>
          ) : (
            <form className="conv-detail__review-form" onSubmit={handleSubmitReview} noValidate>
              <h3 className="conv-detail__review-heading">Add Review</h3>

              <div className="conv-detail__field">
                <label htmlFor="teacherScore" className="conv-detail__label">
                  Score (0–100)
                </label>
                <input
                  id="teacherScore"
                  type="number"
                  min="0"
                  max="100"
                  className="conv-detail__score-input"
                  value={teacherScore}
                  onChange={(e) => setTeacherScore(e.target.value)}
                  placeholder="e.g. 85"
                />
              </div>

              <div className="conv-detail__field">
                <label htmlFor="teacherComment" className="conv-detail__label">
                  Comment
                </label>
                <textarea
                  id="teacherComment"
                  className="conv-detail__comment-input"
                  rows={4}
                  value={teacherComment}
                  onChange={(e) => setTeacherComment(e.target.value)}
                  placeholder="Write your feedback for the student…"
                />
              </div>

              {submitError && (
                <p className="conv-detail__submit-error">{submitError}</p>
              )}

              <button
                type="submit"
                className="conv-detail__submit-btn"
                disabled={submitting}
              >
                {submitting ? 'Saving…' : 'Save Review'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Student: teacher feedback */}
      {!isTeacher && (
        <div className="conv-detail__feedback-section">
          {alreadyReviewed ? (
            <div className="conv-detail__feedback">
              <h3 className="conv-detail__feedback-heading">Teacher Feedback</h3>
              <div className="conv-detail__feedback-score">
                Teacher score: <strong>{conversation.teacherScore}/100</strong>
              </div>
              {conversation.teacherComment && (
                <p className="conv-detail__feedback-comment">"{conversation.teacherComment}"</p>
              )}
            </div>
          ) : (
            conversation.status === 'completed' && (
              <p className="conv-detail__awaiting">
                Your teacher hasn't reviewed this conversation yet.
              </p>
            )
          )}
        </div>
      )}

      {/* Reply thread — visible to both roles once reviewed */}
      {showThread && (
        <div className="conv-detail__thread">
          <h3 className="conv-detail__thread-heading">Discussion</h3>

          {replies.length === 0 && (
            <p className="conv-detail__thread-empty">No replies yet. Start the discussion below.</p>
          )}

          <div className="conv-thread__list">
            {replies.map((reply, i) => (
              <ThreadMessage
                key={i}
                reply={reply}
                isOwnMessage={reply.role === user.role}
              />
            ))}
            <div ref={threadEndRef} />
          </div>

          <form className="conv-thread__form" onSubmit={handleReply} noValidate>
            <textarea
              className="conv-thread__input"
              rows={2}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply…"
              disabled={replySubmitting}
            />
            {replyError && <p className="conv-thread__error">{replyError}</p>}
            <button
              type="submit"
              className="conv-thread__send-btn"
              disabled={replySubmitting || !replyText.trim()}
            >
              {replySubmitting ? 'Sending…' : 'Send Reply'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default ConversationDetailPage;
