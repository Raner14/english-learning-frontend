import { useState, useMemo } from 'react';
import './stage-common.css';
import './VocabMCStage.css';

function buildQuestions(vocab) {
  return vocab.map((item) => {
    const distractors = vocab
      .filter((v) => v.vocabularyId !== item.vocabularyId)
      .map((v) => v.word)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    const options = [item.word, ...distractors].sort(() => Math.random() - 0.5);
    return { ...item, options };
  });
}

function VocabMCStage({ vocab, onNext, onBack }) {
  const questions = useMemo(() => buildQuestions(vocab), [vocab]);
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
      [index]: { selected: option, correct: option === current.word },
    }));
  }

  function handleReset() {
    setAnswers({});
    setIndex(0);
  }

  function optionClass(opt) {
    if (!answered) return 'mc-option';
    if (opt === answered.selected) {
      return answered.correct ? 'mc-option mc-option--correct' : 'mc-option mc-option--wrong';
    }
    return 'mc-option mc-option--faded';
  }

  if (!questions.length) {
    return (
      <div className="stage-wrap">
        <div className="stage-topbar">
          <button type="button" className="stage-back-btn" onClick={onBack}>← Vocabulary</button>
          <span className="stage-label stage-label--amber">Vocabulary Warm-Up</span>
        </div>
        <p className="mc-empty">No exercises available for this lesson.</p>
        <button type="button" className="stage-cta-btn stage-cta-btn--amber" onClick={onNext}>
          Continue →
        </button>
      </div>
    );
  }

  return (
    <div className="stage-wrap">
      <div className="stage-topbar">
        <button type="button" className="stage-back-btn" onClick={onBack}>← Vocabulary</button>
        <div className="stage-meta">
          <span className="stage-label stage-label--amber">Vocabulary Warm-Up</span>
          <span className="stage-progress">{index + 1} / {questions.length}</span>
        </div>
      </div>

      <div className="stage-track">
        <div className="stage-track-fill stage-track-fill--amber"
          style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
      </div>

      <div className="mc-card">
        <p className="mc-card__instruction">Choose the correct word to complete the sentence</p>
        <p className="mc-card__sentence">{current?.completeSentence}</p>
        <div className="mc-options">
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
        <div className="mc-last-actions">
          <button type="button" className="mc-reset-btn" onClick={handleReset}>
            ↺ Reset
          </button>
          <button type="button" className="stage-cta-btn stage-cta-btn--amber" onClick={onNext}>
            Let's keep playing! →
          </button>
        </div>
      )}
    </div>
  );
}

export default VocabMCStage;
