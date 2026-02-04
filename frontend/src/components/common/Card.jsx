import "./Card.css";




function Card({ title, children, footer }) {
  return (
    <div className="card">
      {title && <h3 className="card-title">{title}</h3>}

      <div className="card-content">
        {children}
      </div>

      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
}

export default Card;