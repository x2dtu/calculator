const OperationButton = ({ type, operation, dispatch }) => {
  return (
    <button
      className="operand"
      onClick={() => dispatch({ type: type, payload: { operation } })}
    >
      {operation}
    </button>
  );
};

export default OperationButton;
