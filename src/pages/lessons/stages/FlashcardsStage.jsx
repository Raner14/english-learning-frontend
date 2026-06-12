import { useState } from 'react';
import './stage-common.css';
import './FlashcardsStage.css';

function highlightWord(example, word) {
  if (!example || !word) return example;
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = example.split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === word.toLowerCase()
      ? <strong key={i} className="flashcard__highlight">{part}</strong>
      : part
  );
}

function FlashcardsStage({ vocab, onNext, onBack }) {
  const [index, setIndex] = useState(0);

  if (!vocab.length) return null;

  const item = vocab[index];
  const isFirst = index === 0;
  const isLast = index === vocab.length - 1;

  return (
    <div className="stage-wrap">
      <div className="stage-topbar">
        <button type="button" className="stage-back-btn" onClick={onBack}>
          ← Back to Lessons
        </button>
        <div className="stage-meta">
          <span className="stage-label">Vocabulary</span>
          <span className="stage-progress">{index + 1} / {vocab.length}</span>
        </div>
      </div>

      <div className="stage-track">
        <div className="stage-track-fill" style={{ width: `${((index + 1) / vocab.length) * 100}%` }} />
      </div>

      <div className="flashcard">
        <div className="flashcard__word">{item.word}</div>
        <div className="flashcard__translation">{item.translation}</div>
        {item.example && (
          <p className="flashcard__example">{highlightWord(item.example, item.word)}</p>
        )}
      </div>

      <div className="stage-arrows-row">
        <div className="stage-arrow-slot">
          {!isFirst && (
            <button type="button" className="stage-arrow" onClick={() => setIndex((i) => i - 1)}>
              ←
            </button>
          )}
        </div>
        <div className="stage-arrow-slot">
          {!isLast && (
            <button type="button" className="stage-arrow" onClick={() => setIndex((i) => i + 1)}>
              →
            </button>
          )}
        </div>
      </div>

      {isLast && (
        <button type="button" className="stage-cta-btn stage-cta-btn--amber" onClick={onNext}>
          Move to Vocabulary Warm-Up →
        </button>
      )}
    </div>
  );
}

export default FlashcardsStage;
