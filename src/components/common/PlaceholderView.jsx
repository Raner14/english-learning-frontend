import './PlaceholderView.css';

function PlaceholderView({ title }) {
  return (
    <div className="placeholder-view">
      <h2 className="placeholder-view__title">{title}</h2>
    </div>
  );
}

export default PlaceholderView;
