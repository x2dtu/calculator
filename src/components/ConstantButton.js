const ConstantButton = ({ symbol, value, isRadians, type, dispatch }) => {
  return (
    <button
      onClick={() =>
        dispatch({ type: type, payload: { value, symbol, isRadians } })
      }
    >
      {symbol}
    </button>
  );
};

export default ConstantButton;
