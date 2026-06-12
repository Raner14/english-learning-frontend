import { useState, useMemo } from 'react';
import './stage-common.css';
import './MatchDefinitionStage.css';

function MatchDefinitionStage({ vocab, onNext, onBack }) {
  const shuffledDefs = useMemo(
    () =>
      [...vocab]
        .map((v, i) => ({ ...v, wordNumber: i + 1 }))
        .sort(() => Math.random() - 0.5),
    [vocab]
  );

  const [answers, setAnswers] = useState({});
  const [checkResult, setCheckResult] = useState(null);

  function handleCheck() {
    const result = shuffledDefs.map((def, i) => {
      const typed = Number(answers[i]);
      return typed === def.wordNumber;
    });
    setCheckResult(result);
  }

  function handleReset() {
    setAnswers({});
    setCheckResult(null);
  }

  function rowClass(i) {
    if (!checkResult) return 'match-row';
    return checkResult[i] ? 'match-row match-row--correct' : 'match-row match-row--wrong';
  }

  return (
    <div className="stage-wrap">
      <div className="stage-topbar">
        <button type="button" className="stage-back-btn" onClick={onBack}>← Vocabulary Warm-Up</button>
        <span className="stage-label stage-label--violet">Match the Words</span>
      </div>

      <div className="match-columns">
        <div className="match-words">
          <p className="match-col-title">Words</p>
          {vocab.map((item, i) => (
            <div key={item.vocabularyId} className="match-word-row">
              <span className="match-word-num">{i + 1}.</span>
              <span className="match-word-text">{item.word}</span>
            </div>
          ))}
        </div>

        <div className="match-defs">
          <p className="match-col-title">Definitions</p>
          {shuffledDefs.map((def, i) => (
            <div key={def.vocabularyId} className={rowClass(i)}>
              <input
                type="number"
                min="1"
                max={vocab.length}
                className="match-input"
                value={answers[i] ?? ''}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [i]: e.target.value }))
                }
                disabled={!!checkResult}
                placeholder="#"
              />
              <span className="match-def-text">{def.definition}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="match-actions">
        {!checkResult ? (
          <button type="button" className="match-check-btn" onClick={handleCheck}>
            Check
          </button>
        ) : (
          <button type="button" className="match-reset-btn" onClick={handleReset}>
            Reset
          </button>
        )}
      </div>

      <button type="button" className="stage-cta-btn stage-cta-btn--violet" onClick={onNext}>
        When you feel ready, learn the grammar rule! →
      </button>
    </div>
  );
}

export default MatchDefinitionStage;
