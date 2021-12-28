const OperationButton = ({ operation, className, type, dispatch }) => {
  return (
    <button
      className={className}
      onClick={() => dispatch({ type: type, payload: { operation } })}
    >
      {operation}
    </button>
  );
};

export default OperationButton;
