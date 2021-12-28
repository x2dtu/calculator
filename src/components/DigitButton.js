const DigitButton = ({ type, digit, isRadians, dispatch }) => {
  return (
    <button
      onClick={() => dispatch({ type: type, payload: { digit, isRadians } })}
    >
      {digit}
    </button>
  );
};

export default DigitButton;
