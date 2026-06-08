import './Card.css';

// Generic card container — wraps any content in a white rounded box with a border.
function Card({ children, className = '' }) {
  return (
    <div className={['card', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}

export default Card;
