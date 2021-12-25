import { FaBackspace, FaClock } from "react-icons/fa";
import { useReducer, useState } from "react";
import DigitButton from "./components/DigitButton";
import OperationButton from "./components/OperationButton";
import "./app.css";

export const ACTIONS = {
  ADD_DIGIT: "add-digit",
  DEL_DIGIT: "del-digit",
  ADD_OPERATION: "add_operation",
  PERCENT: "percent",
  PARENTHESIS: "parenthesis",
  CLEAR: "clear",
  EVALUATE: "evaluate",
};

const INIT = {
  leftOperand: "",
  rightOperand: "",
  problem: "",
  answer: "",
  operation: "",
  trueAnswer: 0,
};
function add_digit(state, payload) {
  if (state.operation) {
    if (!state.rightOperand && payload.digit === ".") {
      return {
        ...state,
        rightOperand: "0.",
        problem: state.problem + "0.",
      };
    }
    if (state.rightOperand.includes(".") && payload.digit === ".") {
      return state;
    }
    if (state.rightOperand === "0" && payload.digit !== ".") {
      const pseudoAnswer = evaluate({ ...state, rightOperand: payload.digit })
        .problem;
      return {
        ...state,
        rightOperand: payload.digit,
        problem: `${state.leftOperand} ${state.operation} ${payload.digit}`,
        answer: pseudoAnswer,
      };
    }
    const pseudoAnswer = evaluate({
      ...state,
      rightOperand: state.rightOperand + payload.digit,
    }).problem;
    return {
      ...state,
      problem: `${state.leftOperand} ${state.operation} ${state.rightOperand +
        payload.digit}`,
      rightOperand: state.rightOperand + payload.digit,
      answer: pseudoAnswer,
    };
  }
  if (!state.leftOperand && payload.digit === ".") {
    return {
      ...state,
      leftOperand: "0.",
      problem: state.problem + "0.",
    };
  }
  if (state.leftOperand.includes(".") && payload.digit === ".") {
    return state;
  }
  if (state.leftOperand === "0" && payload.digit !== ".") {
    return {
      ...state,
      leftOperand: payload.digit,
      problem: payload.digit,
    };
  }
  return {
    ...state,
    leftOperand: state.leftOperand + payload.digit,
    problem: state.leftOperand + payload.digit,
  };
}
/*
 * Evaluates the left operand {OPERATION} right operand
 *
 */
function evaluate(state) {
  if (!state.operation && state.problem.includes("%")) {
    const ans = +state.leftOperand;
    let newAns = ans.toFixed(10).toString();
    newAns = newAns.replace(/0+$/, ""); //remove trailing 0's
    return {
      problem: newAns,
      answer: "",
      leftOperand: newAns,
      rightOperand: "",
      trueAnswer: ans.toFixed(10), //avoid over-precision
      operation: "",
    };
  }
  const left = parseFloat(state.leftOperand);
  const right = parseFloat(state.rightOperand);
  if (isNaN(left) || isNaN(right)) {
    return INIT;
  }
  let ans;
  switch (state.operation) {
    case "+":
      ans = left + right;
      break;
    case "-":
      ans = left - right;
      break;
    case "÷":
      if (right === 0) {
        return {
          ...INIT,
          problem: "Error",
        };
      }
      ans = left / right;
      break;
    case "x":
      ans = left * right;
      break;
    default:
      return state;
  }
  let newAns = ans.toFixed(10).toString();
  newAns = newAns.replace(/0+$/, ""); //remove trailing 0's
  if (newAns.endsWith(".")) {
    newAns = newAns.slice(0, -1);
  }
  return {
    problem: newAns,
    answer: "",
    leftOperand: newAns,
    rightOperand: "",
    trueAnswer: ans.toFixed(10), //avoid over-precision
    operation: "",
  };
}

/*
 * Reducer function for my useReducer
 *
 */
function reducer(state, { type, payload }) {
  switch (type) {
    case ACTIONS.ADD_DIGIT:
      return add_digit(state, payload);
    case ACTIONS.DEL_DIGIT:
      if (state.operation) {
        if (!state.rightOperand) {
          return {
            ...state,
            operation: "",
            problem: state.problem.slice(0, -3),
          };
        }
        const pseudoAnswer = evaluate({
          ...state,
          rightOperand: state.rightOperand.slice(0, -1),
        }).problem;
        return {
          ...state,
          problem: state.problem.slice(0, -1),
          rightOperand: state.rightOperand.slice(0, -1),
          answer: pseudoAnswer,
        };
      }
      return {
        ...state,
        problem: state.problem.slice(0, -1),
        leftOperand: state.leftOperand.slice(0, -1),
      };
    case ACTIONS.CLEAR:
      return INIT;
    case ACTIONS.ADD_OPERATION:
      if (!state.leftOperand) {
        return state;
      }
      if (state.rightOperand) {
        const newState = evaluate(state);
        const newAns = newState.problem;
        return {
          ...newState,
          operation: payload.operation,
          problem: newAns + " " + payload.operation + " ",
        };
      }
      return {
        ...state,
        operation: payload.operation,
        problem: state.problem + " " + payload.operation + " ",
      };
    case ACTIONS.EVALUATE:
      return evaluate(state);
    case ACTIONS.PERCENT:
      if (state.operation) {
        const right = parseFloat(state.rightOperand);
        if (isNaN(right)) {
          return state;
        }
        let newRightOperand = (right / 100).toFixed(10) + "";
        newRightOperand = newRightOperand.replace(/0+$/, ""); //remove trailing 0's
        if (newRightOperand.endsWith(".")) {
          newRightOperand = newRightOperand.slice(0, -1);
        }
        const pseudoAnswer = evaluate({
          ...state,
          rightOperand: newRightOperand,
        }).problem;
        return {
          ...state,
          problem: state.problem + "%",
          rightOperand: newRightOperand,
          answer: pseudoAnswer,
        };
      }
      const left = parseFloat(state.leftOperand);
      if (isNaN(left)) {
        return state;
      }
      let newLeftOperand = (left / 100).toFixed(10) + "";
      newLeftOperand = newLeftOperand.replace(/0+$/, ""); //remove trailing 0's
      if (newLeftOperand.endsWith(".")) {
        newLeftOperand = newLeftOperand.slice(0, -1);
      }
      const pseudoAnswer = evaluate({
        ...state,
        problem: state.problem + "%",
        leftOperand: newLeftOperand,
      }).problem;
      return {
        ...state,
        problem: state.problem + "%",
        leftOperand: newLeftOperand,
        answer: pseudoAnswer,
      };
    case ACTIONS.PARENTHESIS:
      if (payload.isRight) {
        return {
          ...state,
          problem: state.problem + ")",
        };
      }
      return;
    default:
      return state;
  }
}

function App() {
  const [state, dispatch] = useReducer(reducer, INIT);
  const [isAlt, setAlt] = useState(false); //for 2nd, have altDigit attributes for digitbuttons etc.
  return (
    <div className="container">
      <div className="answerScreen">
        <div className="problem">{state.problem}</div>
        <div className="answer">{state.answer}</div>
      </div>
      <div className="touchpad">
        <div className="top">
          <button id="2nd">2nd</button>
          <button id="memory">
            <FaClock />
          </button>
          <div className="backspace">
            <button
              onClick={() => dispatch({ type: ACTIONS.DEL_DIGIT })}
              id="backspace"
            >
              <FaBackspace />
            </button>
          </div>
        </div>
        <div className="bottom">
          <button onClick={() => dispatch({ type: ACTIONS.CLEAR })}>C</button>
          <button>()</button>
          <button onClick={() => dispatch({ type: ACTIONS.PERCENT })}>%</button>
          <OperationButton
            operation="÷"
            dispatch={dispatch}
            type={ACTIONS.ADD_OPERATION}
          />
          <DigitButton digit="7" dispatch={dispatch} type={ACTIONS.ADD_DIGIT} />
          <DigitButton digit="8" dispatch={dispatch} type={ACTIONS.ADD_DIGIT} />
          <DigitButton digit="9" dispatch={dispatch} type={ACTIONS.ADD_DIGIT} />
          <OperationButton
            operation="x"
            dispatch={dispatch}
            type={ACTIONS.ADD_OPERATION}
          />
          <DigitButton digit="4" dispatch={dispatch} type={ACTIONS.ADD_DIGIT} />
          <DigitButton digit="5" dispatch={dispatch} type={ACTIONS.ADD_DIGIT} />
          <DigitButton digit="6" dispatch={dispatch} type={ACTIONS.ADD_DIGIT} />
          <OperationButton
            operation="-"
            dispatch={dispatch}
            type={ACTIONS.ADD_OPERATION}
          />
          <DigitButton digit="1" dispatch={dispatch} type={ACTIONS.ADD_DIGIT} />
          <DigitButton digit="2" dispatch={dispatch} type={ACTIONS.ADD_DIGIT} />
          <DigitButton digit="3" dispatch={dispatch} type={ACTIONS.ADD_DIGIT} />
          <OperationButton
            operation="+"
            dispatch={dispatch}
            type={ACTIONS.ADD_OPERATION}
          />
          <button>+/-</button>
          <DigitButton digit="0" dispatch={dispatch} type={ACTIONS.ADD_DIGIT} />
          <DigitButton digit="." dispatch={dispatch} type={ACTIONS.ADD_DIGIT} />
          <button
            id="equals"
            onClick={() => dispatch({ type: ACTIONS.EVALUATE })}
          >
            =
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
