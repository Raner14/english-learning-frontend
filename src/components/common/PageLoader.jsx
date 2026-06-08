import Loader from './Loader';
import './PageLoader.css';

// Full-screen overlay shown while waiting for a server response.
// Usage: {isLoading && <PageLoader />}  or  {isLoading && <PageLoader text="Saving..." />}
function PageLoader({ text = '' }) {
  return (
    <div className="page-loader" aria-live="polite">
      <Loader text={text} />
    </div>
  );
}

export default PageLoader;
