const PercAndFactButton = ({ operation, isRadians, type, dispatch }) => {
  return (
    <button
      onClick={() =>
        dispatch({ type: type, payload: { operation, isRadians } })
      }
    >
      {operation}
    </button>
  );
};

export default PercAndFactButton;
