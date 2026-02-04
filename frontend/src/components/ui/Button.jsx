import "./Button.css";


function Button({ text, onClick, type = "button", className }) {
  return (
    <button className={className} type={type} onClick={onClick}>
      {text}
    </button>
  );
}

export default Button;