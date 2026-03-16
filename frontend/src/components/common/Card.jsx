import "./Card.css";

function Card({ title, children, footer, className = "", style }) {
  return (
    <div className={`card ${className}`} style={style}>
      {title && <h3 className="card-title">{title}</h3>}
      <div className="card-content">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
}

export default Card;
