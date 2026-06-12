import { useState } from 'react';
import './stage-common.css';
import './GrammarMCStage.css';

function GrammarMCStage({ questions, onNext, onBack }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  const isFirst = index === 0;
  const isLast = index === questions.length - 1;
  const current = questions[index];
  const answered = answers[index];

  function handleAnswer(option) {
    if (answered) return;
    setAnswers((prev) => ({
      ...prev,
      [index]: { selected: option, correct: option === current.correctAnswer },
    }));
  }

  function handleReset() {
    setAnswers({});
    setIndex(0);
  }

  function optionClass(opt) {
    if (!answered) return 'gmc-option';
    if (opt === answered.selected) {
      return answered.correct ? 'gmc-option gmc-option--correct' : 'gmc-option gmc-option--wrong';
    }
    return 'gmc-option gmc-option--faded';
  }

  if (!questions.length) {
    return (
      <div className="stage-wrap">
        <div className="stage-topbar">
          <button type="button" className="stage-back-btn" onClick={onBack}>← Grammar Rule</button>
          <span className="stage-label stage-label--indigo">Grammar Warm-Up</span>
        </div>
        <p className="gmc-empty">No grammar exercises available for this lesson.</p>
        <button type="button" className="stage-cta-btn stage-cta-btn--indigo" onClick={onNext}>
          Start Conversation →
        </button>
      </div>
    );
  }

  return (
    <div className="stage-wrap">
      <div className="stage-topbar">
        <button type="button" className="stage-back-btn" onClick={onBack}>← Grammar Rule</button>
        <div className="stage-meta">
          <span className="stage-label stage-label--indigo">Grammar Warm-Up</span>
          <span className="stage-progress">{index + 1} / {questions.length}</span>
        </div>
      </div>

      <div className="stage-track">
        <div className="stage-track-fill stage-track-fill--indigo"
          style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
      </div>

      <div className="gmc-card">
        <p className="gmc-card__instruction">{current?.instruction || 'Choose the correct answer'}</p>
        <p className="gmc-card__sentence">{current?.content}</p>
        <div className="gmc-options">
          {current?.options?.map((opt) => (
            <button key={opt} type="button" className={optionClass(opt)} onClick={() => handleAnswer(opt)}>
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="stage-arrows-row">
        <div className="stage-arrow-slot">
          {!isFirst && (
            <button type="button" className="stage-arrow" onClick={() => setIndex((i) => i - 1)}>←</button>
          )}
        </div>
        <div className="stage-arrow-slot">
          {!isLast && (
            <button type="button" className="stage-arrow" onClick={() => setIndex((i) => i + 1)}>→</button>
          )}
        </div>
      </div>

      {isLast && (
        <div className="gmc-last-actions">
          <button type="button" className="gmc-reset-btn" onClick={handleReset}>
            ↺ Reset
          </button>
          <button type="button" className="stage-cta-btn stage-cta-btn--indigo" onClick={onNext}>
            When you feel ready, start a conversation with AI! →
          </button>
        </div>
      )}
    </div>
  );
}

export default GrammarMCStage;
