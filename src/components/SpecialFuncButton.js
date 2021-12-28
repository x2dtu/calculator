const SpecialFuncButton = ({ func, isRadians, type, dispatch }) => {
  return (
    <button
      onClick={() => dispatch({ type: type, payload: { func, isRadians } })}
    >
      {func}
    </button>
  );
};

export default SpecialFuncButton;
