const DigitButton = ({ type, digit, dispatch }) => {
  return (
    <button onClick={() => dispatch({ type: type, payload: { digit } })}>
      {digit}
    </button>
  );
};

export default DigitButton;
