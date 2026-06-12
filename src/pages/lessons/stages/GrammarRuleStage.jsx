import './stage-common.css';
import './GrammarRuleStage.css';

function GrammarRuleStage({ grammar, onNext, onBack }) {
  if (!grammar) {
    return (
      <div className="stage-wrap">
        <div className="stage-topbar">
          <button type="button" className="stage-back-btn" onClick={onBack}>← Matching</button>
          <span className="stage-label stage-label--green">Grammar Rule</span>
        </div>
        <p className="gr-empty">No grammar rule found for this lesson.</p>
        <button type="button" className="stage-cta-btn stage-cta-btn--green" onClick={onNext}>
          Start Grammar Warm-Up →
        </button>
      </div>
    );
  }

  const { grammarRuleId, category, usage, forms, spellingRules, examples, keywords } = grammar;

  return (
    <div className="stage-wrap">
      <div className="stage-topbar">
        <button type="button" className="stage-back-btn" onClick={onBack}>← Matching</button>
        <span className="stage-label stage-label--green">Grammar Rule</span>
      </div>

      <div className="gr-card">
        <div className="gr-card__heading">
          <h2 className="gr-card__rule-name">{grammarRuleId?.replace(/_/g, ' ')}</h2>
          {category && <span className="gr-card__category">{category}</span>}
        </div>

        {usage && (
          <div className="gr-section">
            <p className="gr-section__title">When to use</p>
            <p className="gr-section__body">{usage}</p>
          </div>
        )}

        {forms && Object.keys(forms).length > 0 && (
          <div className="gr-section">
            <p className="gr-section__title">Forms</p>
            <div className="gr-forms">
              {Object.entries(forms).map(([key, val]) => (
                <div key={key} className="gr-form-row">
                  <span className="gr-form-key">{key.replace(/_/g, ' ')}</span>
                  <span className="gr-form-val">{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {spellingRules && (
          <div className="gr-section">
            <p className="gr-section__title">Spelling rules</p>
            <p className="gr-section__body">{spellingRules}</p>
          </div>
        )}

        {examples?.length > 0 && (
          <div className="gr-section">
            <p className="gr-section__title">Examples</p>
            <div className="gr-examples">
              {examples.map((ex, i) => (
                <div key={i} className="gr-example">
                  <span className="gr-example__text">"{ex.text}"</span>
                  {ex.type && <span className="gr-example__type">{ex.type}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {keywords?.length > 0 && (
          <div className="gr-section">
            <p className="gr-section__title">Keywords</p>
            <div className="gr-keywords">
              {keywords.map((kw) => (
                <span key={kw} className="gr-keyword">{kw}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <button type="button" className="stage-cta-btn stage-cta-btn--green" onClick={onNext}>
        Start Grammar Warm-Up →
      </button>
    </div>
  );
}

export default GrammarRuleStage;
