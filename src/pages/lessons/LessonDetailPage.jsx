import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLesson, getLessonGrammar, getLessonVocab, getLessonGrammarWarmup } from '../../services/lessonService';
import PageLoader from '../../components/common/PageLoader';
import FlashcardsStage from './stages/FlashcardsStage';
import VocabMCStage from './stages/VocabMCStage';
import MatchDefinitionStage from './stages/MatchDefinitionStage';
import GrammarRuleStage from './stages/GrammarRuleStage';
import GrammarMCStage from './stages/GrammarMCStage';
import ConversationStage from './stages/ConversationStage';
import './LessonDetailPage.css';

const PHASES = [
  'flashcards',
  'vocab-mc',
  'match-definition',
  'grammar-rule',
  'grammar-mc',
  'active',
  'ended',
];

function LevelBadge({ level }) {
  const cls = {
    Beginner: 'ld__badge--beginner',
    Intermediate: 'ld__badge--intermediate',
    Advanced: 'ld__badge--advanced',
  }[level] || '';
  return <span className={`ld__badge ${cls}`}>{level}</span>;
}

function EndedView({ result, onBack }) {
  const cls =
    result.aiScore >= 80 ? 'result--high' : result.aiScore >= 60 ? 'result--mid' : 'result--low';
  return (
    <div className={`lesson-result ${cls}`}>
      <p className="lesson-result__score">
        {result.aiScore}<span>/100</span>
      </p>
      <p className="lesson-result__label">AI Score</p>
      <p className="lesson-result__feedback">"{result.aiFeedback}"</p>
      <button type="button" className="lesson-result__btn" onClick={onBack}>
        Back to Lessons
      </button>
    </div>
  );
}

function LessonDetailPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);
  const [grammar, setGrammar] = useState(null);
  const [vocab, setVocab] = useState([]);
  const [grammarWarmup, setGrammarWarmup] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [pageLoading, setPageLoading] = useState(true);
  const [phase, setPhase] = useState('flashcards');
  const [result, setResult] = useState(null);

  useEffect(() => {
    Promise.all([
      getLesson(lessonId),
      getLessonGrammar(lessonId).catch(() => null),
      getLessonVocab(lessonId).catch(() => []),
      getLessonGrammarWarmup(lessonId).catch(() => []),
    ])
      .then(([lessonData, grammarData, vocabData, warmupData]) => {
        setLesson(lessonData);
        setGrammar(grammarData);
        setVocab(vocabData || []);
        setGrammarWarmup(warmupData || []);
      })
      .catch((err) =>
        setLoadError(err?.response?.data?.error?.message || 'Failed to load lesson.')
      )
      .finally(() => setPageLoading(false));
  }, [lessonId]);

  function advance() {
    setPhase((p) => {
      const idx = PHASES.indexOf(p);
      return idx < PHASES.length - 1 ? PHASES[idx + 1] : p;
    });
  }

  function retreat() {
    setPhase((p) => {
      const idx = PHASES.indexOf(p);
      return idx > 0 ? PHASES[idx - 1] : p;
    });
  }

  if (pageLoading) return <PageLoader text="Loading lesson…" />;

  if (loadError) {
    return (
      <div className="lesson-detail">
        <button type="button" className="ld__back" onClick={() => navigate('/lessons')}>
          ← Back to Lessons
        </button>
        <p className="ld__error">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="lesson-detail">
      <div className="ld__header">
        <div className="ld__title-row">
          <h1 className="ld__title">{lesson?.title}</h1>
          <LevelBadge level={lesson?.level} />
        </div>
        <p className="ld__scene">{lesson?.scene}</p>
      </div>

      <div className="ld__stage">
        {phase === 'flashcards' && (
          <FlashcardsStage vocab={vocab} onNext={advance} onBack={() => navigate('/lessons')} />
        )}
        {phase === 'vocab-mc' && (
          <VocabMCStage vocab={vocab} onNext={advance} onBack={retreat} />
        )}
        {phase === 'match-definition' && (
          <MatchDefinitionStage vocab={vocab} onNext={advance} onBack={retreat} />
        )}
        {phase === 'grammar-rule' && (
          <GrammarRuleStage grammar={grammar} onNext={advance} onBack={retreat} />
        )}
        {phase === 'grammar-mc' && (
          <GrammarMCStage questions={grammarWarmup} onNext={advance} onBack={retreat} />
        )}
        {phase === 'active' && (
          <ConversationStage
            lesson={lesson}
            vocab={vocab}
            onEnd={(aiScore, aiFeedback) => {
              setResult({ aiScore, aiFeedback });
              setPhase('ended');
            }}
            onBack={retreat}
          />
        )}
        {phase === 'ended' && result && (
          <EndedView result={result} onBack={() => navigate('/lessons')} />
        )}
      </div>
    </div>
  );
}

export default LessonDetailPage;
