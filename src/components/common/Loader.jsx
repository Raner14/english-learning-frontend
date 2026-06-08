import './Loader.css';

// Each letter of LINGUA bounces in a wave pattern — staggered by animationDelay.
const LETTERS = ['L', 'I', 'N', 'G', 'U', 'A'];

function Loader({ text = '' }) {
  return (
    <div className="loader" role="status" aria-label="Loading">
      <div className="loader__word" aria-hidden="true">
        {LETTERS.map((letter, i) => (
          <span
            key={letter + i}
            className="loader__letter"
            style={{ animationDelay: `${i * 0.13}s` }}
          >
            {letter}
          </span>
        ))}
      </div>

      <div className="loader__dots" aria-hidden="true">
        <span className="loader__dot" style={{ animationDelay: '0s' }} />
        <span className="loader__dot" style={{ animationDelay: '0.2s' }} />
        <span className="loader__dot" style={{ animationDelay: '0.4s' }} />
      </div>

      {text && <p className="loader__text">{text}</p>}
    </div>
  );
}

export default Loader;
