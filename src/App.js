import { FaBackspace, FaClock } from "react-icons/fa";
import { useReducer, useState, useRef } from "react";
import DigitButton from "./components/DigitButton";
import OperationButton from "./components/OperationButton";
import ConstantButton from "./components/ConstantButton";
import PercAndFactButton from "./components/PercAndFactButton";
import SpecialFuncButton from "./components/SpecialFuncButton";
import "./app.css";

export const ACTIONS = {
  ADD_DIGIT: "add-digit",
  DEL_DIGIT: "del-digit",
  ADD_OPERATION: "add-operation",
  PERCENT: "percent",
  PARENTHESIS: "parenthesis",
  CLEAR: "clear",
  EVALUATE: "evaluate",
  ADD_CONSTANT: "add-constant",
  SPECIAL_FUNC: "special-func",
  NEGATE: "negate",
  INVERSE: "inverse",
  CLEAR_HISTORY: "clear-history",
  SELECT_PROBLEM: "select-problem",
  SELECT_ANSWER: "select-answer",
};

const INIT = {
  problem: "",
  answer: "",
  operations: [],
  values: [""],
  hasEvaluated: false,
  history: [],
};

/*
 * Reducer function for my useReducer
 *
 */
function reducer(state, { type, payload }) {
  switch (type) {
    case ACTIONS.ADD_DIGIT:
      return add_digit(state, payload);
    case ACTIONS.DEL_DIGIT:
      return del_digit(state, payload);
    case ACTIONS.CLEAR:
      return {
        ...INIT,
        problem: "",
        operations: [],
        values: [""],
      };
    case ACTIONS.ADD_OPERATION:
      if (
        (!state.values.at(-1) && state.values.length === 1) ||
        state.values.at(-1).includes("Error")
      ) {
        return state;
      }

      // changing operation from one to another
      if (!state.values.at(-1)) {
        state.operations[state.operations.length - 1] = payload.operation;
        if (payload.operation === "^") {
          state.values[state.values.length - 1] += "(";
          return {
            ...state,
            problem: state.problem.slice(0, -2) + payload.operation + " (",
          };
        }
        return {
          ...state,
          problem: state.problem.slice(0, -2) + payload.operation + " ",
        };
      }

      // we want parentheses around starting exponent
      if (payload.operation === "^") {
        return {
          ...state,
          problem: state.problem + " " + payload.operation + " (",
          operations: state.operations.concat(payload.operation),
          values: state.values.concat("("),
          answer: "",
          hasEvaluated: false,
        };
      }

      return {
        ...state,
        problem: state.problem + " " + payload.operation + " ",
        operations: state.operations.concat(payload.operation),
        values: state.values.concat(""),
        answer: "",
        hasEvaluated: false,
      };
    case ACTIONS.EVALUATE:
      let answer = evaluateProblem(state, payload.isRadians);
      // if we can't get an answer then do nothing
      if (!state.answer) {
        return state;
      }

      // if we have a single term with a constant like pi or e
      if (state.answer && state.values.length === 1) {
        answer = state.answer;
      }

      // format the problem with correct number of right parentheses so
      // that it looks good in history
      let [leftCount, rightCount] = [0, 0];
      for (let char of state.problem) {
        if (char === "(") {
          leftCount += 1;
        } else if (char === ")") {
          rightCount += 1;
        }
      }
      const toRepeat = leftCount - rightCount;
      state.problem += ")".repeat(toRepeat);

      const oldState = {
        values: state.values,
        operations: state.operations,
        problem: state.problem,
        answer: "= " + state.answer,
      };
      // add old state if we are evaludated, but not if user has
      // already evaluated and hitting equals button a second time
      if (!state.hasEvaluated) {
        state.history.push(oldState);
      }

      return {
        answer: "",
        problem: answer,
        values: [answer],
        hasEvaluated: true,
        history: state.history,
        operations: [],
      };
    case ACTIONS.PERCENT:
      // this action will be used for percent and factorial
      // as a result, the payload operation will be "%" or "!"
      if (
        !state.values.at(-1).match(/[0-9]/) ||
        state.values.at(-1).includes(payload.operation)
      ) {
        return state;
      }
      state.values[state.values.length - 1] += payload.operation;
      const evaluated = evaluateProblem(state, payload.isRadians);
      return {
        ...state,
        problem: state.problem + payload.operation,
        answer: evaluated,
      };
    case ACTIONS.PARENTHESIS:
      // could do if (payload.isRight)
      if (!state.values.at(-1).match(/[0-9]/)) {
        state.values[state.values.length - 1] = state.values.at(-1) + "(";
        return {
          ...state,
          problem: state.problem + "(",
        };
      }
      // ex: (5)
      if (balanceParentheses(state.values, false) === 0) {
        return {
          ...state,
          operations: state.operations.concat("x"),
          values: state.values.concat("("),
          problem: state.problem + " x (",
          hasEvaluated: false,
        };
      }
      // ex: (5
      state.values[state.values.length - 1] = state.values.at(-1) + ")";
      return {
        ...state,
        problem: state.problem + ")",
      };
    case ACTIONS.NEGATE:
      if (state.values.at(-1).includes("(-")) {
        state.values[state.values.length - 1] = state.values
          .at(-1)
          .replace("(-", "");
        const lastIndex = state.problem.lastIndexOf("(-");
        state.problem =
          state.problem.slice(0, lastIndex) +
          state.problem.slice(lastIndex + 2);
        return {
          ...state,
          answer: evaluateProblem(state, payload.isRadians),
        };
      }
      const lastIndexValue = state.values.at(-1).lastIndexOf("(");
      if (lastIndexValue !== -1) {
        state.values[state.values.length - 1] =
          state.values.at(-1).slice(0, lastIndexValue + 1) +
          "(-" +
          state.values.at(-1).slice(lastIndexValue + 1);
        const lastIndexProblem = state.problem.lastIndexOf("(");
        state.problem =
          state.problem.slice(0, lastIndexProblem + 1) +
          "(-" +
          state.problem.slice(lastIndexProblem + 1);
      } else {
        const indexOfLastParen = state.problem.lastIndexOf("(");
        state.problem =
          state.problem.slice(0, indexOfLastParen + 1) +
          "(-" +
          state.problem.slice(indexOfLastParen + 1);
        state.values[state.values.length - 1] = "(-" + state.values.at(-1);
      }
      return {
        ...state,
        answer: evaluateProblem(state, payload.isRadians),
      };
    case ACTIONS.ADD_CONSTANT:
      // payload is object with symbol and value

      // Just clicked equals button, so any add digit operation should clear the
      // calculator and start new calculation with constant
      if (state.hasEvaluated) {
        state.hasEvaluated = false;
        state.problem = "";
        state.values = [""];
      }

      if (!state.values.at(-1).match(/[0-9]/)) {
        state.values[state.values.length - 1] += payload.value; // string concatenation "" + num
        state.problem += payload.symbol;
        return {
          ...state,
          answer: evaluateProblem(state, payload.isRadians),
        };
      }
      state.values.push(payload.value + "");
      state.operations.push("x");
      return {
        ...state,
        problem: state.problem + " x " + payload.symbol,
        answer: evaluateProblem(state, payload.isRadians),
      };
    case ACTIONS.SPECIAL_FUNC:
      // Just clicked equals button, so any special function call
      // should clear the calculator and start new calculation with
      // with special function
      if (state.hasEvaluated) {
        state.hasEvaluated = false;
        state.problem = "";
        state.values = [""];
      }

      if (!state.values.at(-1).match(/[0-9]/)) {
        state.values[state.values.length - 1] += payload.func;
        state.operations.push("/");
        state.values.push("(");
        return {
          ...state,
          problem: state.problem + payload.func + "(",
          answer: evaluateProblem(state, payload.isRadians),
        };
      }

      state.values = state.values.concat([payload.func, "("]);
      state.operations = state.operations.concat(["x", "/"]);
      return {
        ...state,
        problem: state.problem + " x " + payload.func + "(",
        answer: evaluateProblem(state, payload.isRadians),
      };
    case ACTIONS.INVERSE:
      if (!state.values.at(-1).match(/[0-9]/)) {
        state.values[state.values.length - 1] += "1";
        state.problem += "1";
      } else {
        state.values.push("1");
        state.operations.push("x");
        state.problem += " x 1";
      }
      state.operations.push("÷");
      state.values.push("");
      return {
        ...state,
        problem: state.problem + " ÷ ",
        answer: "",
        hasEvaluated: false,
      };
    case ACTIONS.CLEAR_HISTORY:
      return {
        ...state,
        history: [],
      };
    case ACTIONS.SELECT_PROBLEM:
      // payload is oldState

      // if problem ends with numeric digit, clear the problem
      // and start a new one with oldState's answer
      if (state.problem.slice(-1).match(/[0-9]/)) {
        state.values = payload.values;
        state.operations = payload.operations;
        return {
          ...state,
          problem: payload.problem,
          hasEvaluated: false,
          answer: evaluateProblem(state),
        };
      }
      state.values[state.values.length - 1] += payload.values[0]
        ? payload.values[0]
        : "";
      state.values = state.values.concat(payload.values.slice(1));
      state.operations = state.operations.concat(payload.operations);
      return {
        ...state,
        problem: state.problem + payload.problem,
        hasEvaluated: false,
        answer: evaluateProblem(state),
      };
    case ACTIONS.SELECT_ANSWER:
      // payload is oldState's answer

      // slice off the starting "= "
      const newProblem = payload.answer.slice(2);

      // if problem ends with numeric digit, clear the problem
      // and start a new one with oldState's answer
      // we don't care about evaluateProblem second parameter isRadians
      // since the answer can't have a function like a trig function, only
      // a numeric answer
      if (state.problem.slice(-1).match(/[0-9]/)) {
        state.values = [newProblem];
        state.operations = [];
        return {
          ...state,
          hasEvaluated: false,
          problem: newProblem,
          answer: evaluateProblem(state),
        };
      }
      state.values[state.values.length - 1] += newProblem;
      return {
        ...state,
        problem: state.problem + newProblem,
        hasEvaluated: false,
        answer: evaluateProblem(state),
      };
    default:
      return state;
  }
}

function add_digit(state, payload) {
  // Just clicked equals button, so any add digit operation should clear the
  // calculator and start new calculation with payload digit.
  if (state.hasEvaluated) {
    state.hasEvaluated = false;
    state.problem = "";
    state.values = [""];
  }

  const problemNoEndingParen = state.problem.replace(/\)+$/, "");
  // ex: a constant like pi or e and user inputs number, or "4%" and user inputs
  // "2" -> "4% x " and then the default case would make it "4% x 2"
  if (
    problemNoEndingParen.endsWith("π") ||
    problemNoEndingParen.endsWith("e") ||
    state.values.at(-1).endsWith("%")
  ) {
    state.values.push("");
    state.operations.push("x");
    state.problem += " x ";
  }

  if (!state.values.at(-1).match(/[0-9]/) && payload.digit === ".") {
    state.values[state.values.length - 1] = "0.";
    return {
      ...state,
      problem: state.problem + "0.",
    };
  }

  if (payload.digit === "." && state.values.at(-1).includes(".")) {
    return state;
  }

  if (state.values.at(-1) === "0" && payload.digit !== ".") {
    state.values[state.values.length - 1] = payload.digit;
    const evaluated = evaluateProblem(state, payload.isRadians);
    return {
      ...state,
      problem: state.problem.slice(0, -1) + payload.digit,
      answer: evaluated,
    };
  }

  // default case
  state.values[state.values.length - 1] += payload.digit;
  const evaluated = evaluateProblem(state, payload.isRadians);
  return {
    ...state,
    problem: state.problem + payload.digit,
    answer: evaluated,
  };
}

function del_digit(state, payload) {
  if (state.values.at(-1).includes("Error")) {
    return {
      ...state,
      problem: "",
      values: [""],
      operations: [],
      hasEvaluated: false,
      answer: "",
    };
  }
  if (!state.values.at(-1)) {
    if (state.values.length === 1) {
      return state;
    }
    // else looks something like "5 + "
    state.values.pop();
    state.operations.pop();
    const evaluated = evaluateProblem(state, payload.isRadians);
    return {
      ...state,
      problem: state.problem.slice(0, -3),
      answer: evaluated,
    };
  }

  function countLeftParens(string) {
    let count = 0;
    for (let char of string) {
      if (char !== "(") {
        return count;
      }
      count++;
    }
    return count;
  }

  const threeLetterFuncs = ["sin(", "cos(", "tan(", "log("];

  // if we are deleting a constant, we must delete the entire constant value
  if (state.problem.endsWith("π") || state.problem.endsWith("e")) {
    const numLeftParens = countLeftParens(state.values.at(-1));
    state.values[state.values.length - 1] = state.values
      .at(-1)
      .slice(0, numLeftParens);
    state.problem = state.problem.slice(0, -1);
  } else if (threeLetterFuncs.some((func) => state.problem.endsWith(func))) {
    // we are deleting a 3 letter function (with the left parentheses)
    state.values.pop(); // pop off the left parenthesis
    // pop off the "/" special operation since we are deleting the special function
    state.operations.pop();
    const numLeftParens = countLeftParens(state.values.at(-1));
    state.values[state.values.length - 1] = state.values
      .at(-1)
      .slice(0, numLeftParens);
    state.problem = state.problem.slice(0, -4);
  } else if (state.problem.endsWith("ln(")) {
    // we are deleting the two letter ln function (with the left parentheses)
    state.values.pop(); // pop off the left parenthesis
    // pop off the "/" special operation since we are deleting the special function
    state.operations.pop();
    const numLeftParens = countLeftParens(state.values.at(-1));
    state.values[state.values.length - 1] = state.values
      .at(-1)
      .slice(0, numLeftParens);
    state.problem = state.problem.slice(0, -3);
  } else if (state.problem.endsWith("√(")) {
    // we are deleting the one letter √ function (with the left parentheses)
    state.values.pop(); // pop off the left parenthesis
    // pop off the "/" special operation since we are deleting the special function
    state.operations.pop();
    const numLeftParens = countLeftParens(state.values.at(-1));
    state.values[state.values.length - 1] = state.values
      .at(-1)
      .slice(0, numLeftParens);
    state.problem = state.problem.slice(0, -2);
  } else {
    // else, there was a single digit that we can delete, so delete the digit
    state.values[state.values.length - 1] = state.values.at(-1).slice(0, -1);
    state.problem = state.problem.slice(0, -1);
  }

  // if we deleted the last digit of the term, then display a blank answer
  if (!state.values.at(-1)) {
    return {
      ...state,
      answer: "",
    };
  }

  // else, just display the answer with the new rightmost term
  const evaluated = evaluateProblem(state, payload.isRadians);
  return {
    ...state,
    answer: evaluated,
  };
}

function evaluateProblem(state, isRadians) {
  if (state.values.length === 1) {
    if (state.values[0].includes("%") || state.values[0].includes("!")) {
      return evaluate(state.values[0], "0", "+", isRadians);
    }
    if (state.values[0].includes("-")) {
      const answerProblem = state.values[0]
        .replace(/\(/g, "")
        .replace(/\)/g, "");
      return (answerProblem.match(/[0-9]/) || []).join("") ? answerProblem : "";
    }
    if (state.problem.includes("π")) {
      return Math.PI + "";
    }
    if (state.problem.includes("e")) {
      return Math.E + "";
    }
    return ""; // blank answer
  }

  // get copies of the states.values and states.operations arrays; we will ultimately
  // reduce these copies into the final answer
  let finalList = Array.from(state.values);
  let operations = Array.from(state.operations);

  // we need to evaluate parentheses

  let leftParen, rightParen;

  while (finalList.length !== 1) {
    // We will make sure all the parentheses are closed
    balanceParentheses(finalList, true);

    // if there are no parentheses then the indicies will be negative or invalid
    [leftParen, rightParen] = [-1, -1];

    for (let i = 0; i < finalList.length; i++) {
      if (finalList[i].startsWith("(")) {
        leftParen = i;
      }
      if (finalList[i].endsWith(")")) {
        rightParen = i;
        break;
      }
    }

    if (leftParen === -1) {
      // if there are no parentheses, then evaluate entire problem as is
      [leftParen, rightParen] = [0, finalList.length - 1];
    }

    // update finalList and operations, evaluating their subsections given by leftParen
    // and rightParen
    evaluateSubSection(finalList, operations, leftParen, rightParen, isRadians);
  }
  // return the final answer string, which is the last remaining element in finalList
  return finalList[0];
}

function balanceParentheses(finalList, modify) {
  let [leftCount, rightCount] = [0, 0];
  for (let value of finalList) {
    leftCount += (value.match(/\(/g) || []).length;
    rightCount += (value.match(/\)/g) || []).length;
  }
  if (rightCount > leftCount) {
    return "Error";
  }
  const toRepeat = leftCount - rightCount;
  if (modify) {
    finalList[finalList.length - 1] += ")".repeat(toRepeat);
  }
  return toRepeat;
}

function evaluateSubSection(
  finalList,
  operations,
  leftParen,
  rightParen,
  isRadians
) {
  // create new subsection lists from arrays
  const subList = finalList.slice(leftParen, rightParen + 1);

  // remove this pair of parentheses if there are parentheses so that they won't be
  // picked up by evaluateProblem again
  if (subList[0].startsWith("(")) {
    subList[0] = subList[0].slice(1);
    subList[subList.length - 1] = subList.at(-1).slice(0, -1);
  }

  // if we only have one value, just return early
  if (subList.length === 1) {
    finalList.splice(leftParen, rightParen - leftParen + 1, subList[0]);
    return;
  }

  const subOps = operations.slice(leftParen, rightParen);

  // PEMDAS: Parentheses taken care of by evaluateProblem
  function shrink(i) {
    const ans = evaluate(subList[i], subList[i + 1], subOps[i], isRadians); // could be "Error"
    subList[i] = ans;
    subOps.splice(i, 1);
    subList.splice(i + 1, 1);
  }

  // special functions like sqrt, sin, cos, log, etc designated with "/" operation
  for (let i = 0; i < subOps.length; i++) {
    if (subOps[i] === "/") {
      shrink(i);
      i--;
    }
  }

  // exponents (we solve exponents from right to left)
  for (let i = subOps.length - 1; i >= 0; i--) {
    if (subOps[i] === "^") {
      shrink(i);
      i++;
    }
  }

  // multiplication & division (left to right)
  for (let i = 0; i < subOps.length; i++) {
    if (subOps[i] === "x" || subOps[i] === "÷") {
      shrink(i);
      i--;
    }
  }

  // addition and subtraction (left to right)
  for (let i = 0; i < subOps.length; i++) {
    shrink(i);
    i--;
  }

  // update finalList and operations for next iteration of evaluateProblem, taking out the values
  // that were evaluated
  finalList.splice(leftParen, rightParen - leftParen + 1, subList[0]);
  operations.splice(leftParen, rightParen - leftParen);
}

/*
 * Evaluates the left operand {OPERATION} right operand
 *
 */
function evaluate(leftValue, rightValue, operation, isRadians) {
  // when we have sin, just have sin[x] instead of sin(x) or something
  if (typeof rightValue === "undefined") {
    return leftValue; // in case we evaluate on a list of only one element
  }
  if (!rightValue.match(/[0-9]/)) {
    return ""; // we aren't ready to evaluate
  }

  function evalauteFactorialAndPercent(string, value) {
    function factorial(n) {
      if (n % 1 !== 0) {
        // then left is a float
        return "Error (Factorial of Float)";
      }
      const negative = n < 0 ? -1 : 1;
      n *= negative;
      let j = 1;
      for (let i = 1; i <= n; i++) {
        j *= i;
      }
      return j * negative;
    }

    function percent(n) {
      return n / 100;
    }

    if (string.includes("!") && string.includes("%")) {
      if (string.indexOf("!") < string.indexOf("%")) {
        value = percent(factorial(value));
      } else {
        value = factorial(percent(value));
      }
    } else if (string.includes("!")) {
      value = factorial(value);
    } else if (string.includes("%")) {
      value = percent(value);
    }

    return value;
  }

  let result;

  // special operation like sqrt, sin, cos, log, etc
  if (operation === "/") {
    let right = parseFloat(rightValue);
    if (Number.isNaN(right)) {
      return "Error";
    }

    right = evalauteFactorialAndPercent(rightValue, right);
    // could be error returned from this function
    if (right === "Error (Factorial of Float)") {
      return right;
    }

    function sin(n) {
      return isRadians ? Math.sin(n) : Math.sin((n * 180) / Math.PI);
    }

    function cos(n) {
      return isRadians ? Math.cos(n) : Math.cos((n * 180) / Math.PI);
    }

    switch (leftValue) {
      case "√":
        if (right < 0) {
          return "Error (Imaginary Result)";
        }
        result = right ** 0.5;
        break;
      case "sin":
        result = sin(right);
        break;
      case "cos":
        result = cos(right);
        break;
      case "tan":
        const cosine = Number(cos(right).toFixed(10));
        if (cosine === 0) {
          return "Error (Undefined Tangent)";
        }
        result = sin(right) / cosine;
        break;
      case "log":
        if (right <= 0) {
          return "Error (Invalid Logarithm)";
        }
        result = Math.log10(right);
        break;
      case "ln":
        if (right <= 0) {
          return "Error (Invalid Logarithm)";
        }
        result = Math.log(right);
        break;
      default:
        return "Error";
    }
  } else {
    // not a special operation
    let left = parseFloat(leftValue.replace(/^\(/, ""));
    let right = parseFloat(rightValue);
    if (Number.isNaN(left) || Number.isNaN(right)) {
      return "Error";
    }

    // evaluate left operand for factorials or percents
    left = evalauteFactorialAndPercent(leftValue, left);

    // evaluate right operand for factorials or percents
    right = evalauteFactorialAndPercent(rightValue, right);

    // evalauteFactorialAndPercent could have returned an error
    if (
      left === "Error (Factorial of Float)" ||
      right === "Error (Factorial of Float)"
    ) {
      return "Error (Factorial of Float)";
    }

    switch (operation) {
      case "+":
        result = left + right;
        break;
      case "-":
        result = left - right;
        break;
      case "÷":
        if (right === 0) {
          return "Error (Divide By Zero)";
        }
        result = left / right;
        break;
      case "x":
        result = left * right;
        break;
      case "^":
        result = left ** right;
        break;
      default:
        return "Error";
    }
  }

  let answer = result.toFixed(10); // avoid over-precision
  answer = answer.replace(/0+$/, ""); // remove trailing 0's
  if (answer.endsWith(".")) {
    answer = answer.slice(0, -1);
  }
  return answer;
}

function App() {
  const [state, dispatch] = useReducer(reducer, INIT);
  const [is2nd, set2nd] = useState(false); //for 2nd, have altDigit attributes for digitbuttons etc.
  const [is3rd, set3rd] = useState(false);
  const [isRad, setRad] = useState(true);
  const [isHistory, setIsHistory] = useState(false);
  let propKey = useRef(0); // for unique keys for history children

  return (
    <div className="container">
      <div className="answerScreen">
        <div className="problem">{state.problem}</div>
        <div className="answer">{state.answer}</div>
      </div>
      <div className="touchpad">
        <button
          id="2nd"
          className={is2nd ? "second" : null}
          onClick={() => {
            set2nd(!is2nd);
            set3rd(false);
          }}
        >
          2nd
        </button>
        <button
          id="3rd"
          className={is3rd ? "third" : null}
          onClick={() => {
            set3rd(!is3rd);
            set2nd(false);
          }}
        >
          3rd
        </button>
        <button
          className={isHistory ? "clock" : null}
          onClick={() => setIsHistory(!isHistory)}
          id="memory"
        >
          <FaClock />
        </button>
        <button
          onClick={() =>
            dispatch({ type: ACTIONS.DEL_DIGIT, payload: { isRadians: isRad } })
          }
          id="backspace"
        >
          <FaBackspace />
        </button>
        {!isHistory ? (
          <>
            {is2nd ? (
              <>
                <button id="rad" onClick={() => setRad(!isRad)}>
                  {isRad ? (
                    <>
                      <p className="mode">mode:</p>
                      <p>rad</p>
                    </>
                  ) : (
                    <>
                      <p className="mode">mode:</p>
                      <p>deg</p>
                    </>
                  )}
                </button>
                <SpecialFuncButton
                  func="sin"
                  isRadians={isRad}
                  dispatch={dispatch}
                  type={ACTIONS.SPECIAL_FUNC}
                />
                <SpecialFuncButton
                  func="cos"
                  isRadians={isRad}
                  dispatch={dispatch}
                  type={ACTIONS.SPECIAL_FUNC}
                />
                <SpecialFuncButton
                  func="tan"
                  isRadians={isRad}
                  dispatch={dispatch}
                  type={ACTIONS.SPECIAL_FUNC}
                />
              </>
            ) : is3rd ? (
              <>
                <SpecialFuncButton
                  func="log"
                  isRadians={isRad}
                  dispatch={dispatch}
                  type={ACTIONS.SPECIAL_FUNC}
                />
                <SpecialFuncButton
                  func="ln"
                  isRadians={isRad}
                  dispatch={dispatch}
                  type={ACTIONS.SPECIAL_FUNC}
                />
                <button
                  onClick={() =>
                    dispatch({
                      type: ACTIONS.INVERSE,
                      payload: { isRadians: isRad },
                    })
                  }
                >
                  1/x
                </button>
                <PercAndFactButton
                  operation="!"
                  isRadians={isRad}
                  dispatch={dispatch}
                  type={ACTIONS.PERCENT}
                />
              </>
            ) : (
              <>
                <ConstantButton
                  symbol="π"
                  value={Math.PI}
                  isRadians={isRad}
                  dispatch={dispatch}
                  type={ACTIONS.ADD_CONSTANT}
                />
                <ConstantButton
                  symbol="e"
                  value={Math.E}
                  isRadians={isRad}
                  dispatch={dispatch}
                  type={ACTIONS.ADD_CONSTANT}
                />
                <OperationButton
                  operation="^"
                  dispatch={dispatch}
                  type={ACTIONS.ADD_OPERATION}
                />
                <SpecialFuncButton
                  func="√"
                  isRadians={isRad}
                  dispatch={dispatch}
                  type={ACTIONS.SPECIAL_FUNC}
                />
              </>
            )}
            <button
              onClick={() => dispatch({ type: ACTIONS.CLEAR })}
              id="clear"
            >
              C
            </button>
            <button onClick={() => dispatch({ type: ACTIONS.PARENTHESIS })}>
              ()
            </button>
            <PercAndFactButton
              operation="%"
              isRadians={isRad}
              dispatch={dispatch}
              type={ACTIONS.PERCENT}
            />
            <OperationButton
              className="operation"
              operation="÷"
              dispatch={dispatch}
              type={ACTIONS.ADD_OPERATION}
            />
            <DigitButton
              digit="7"
              isRadians={isRad}
              dispatch={dispatch}
              type={ACTIONS.ADD_DIGIT}
            />
            <DigitButton
              digit="8"
              isRadians={isRad}
              dispatch={dispatch}
              type={ACTIONS.ADD_DIGIT}
            />
            <DigitButton
              digit="9"
              isRadians={isRad}
              dispatch={dispatch}
              type={ACTIONS.ADD_DIGIT}
            />
            <OperationButton
              className="operation"
              operation="x"
              dispatch={dispatch}
              type={ACTIONS.ADD_OPERATION}
            />
            <DigitButton
              digit="4"
              isRadians={isRad}
              dispatch={dispatch}
              type={ACTIONS.ADD_DIGIT}
            />
            <DigitButton
              digit="5"
              isRadians={isRad}
              dispatch={dispatch}
              type={ACTIONS.ADD_DIGIT}
            />
            <DigitButton
              digit="6"
              isRadians={isRad}
              dispatch={dispatch}
              type={ACTIONS.ADD_DIGIT}
            />
            <OperationButton
              className="operation"
              operation="-"
              dispatch={dispatch}
              type={ACTIONS.ADD_OPERATION}
            />
            <DigitButton
              digit="1"
              isRadians={isRad}
              dispatch={dispatch}
              type={ACTIONS.ADD_DIGIT}
            />
            <DigitButton
              digit="2"
              isRadians={isRad}
              dispatch={dispatch}
              type={ACTIONS.ADD_DIGIT}
            />
            <DigitButton
              digit="3"
              isRadians={isRad}
              dispatch={dispatch}
              type={ACTIONS.ADD_DIGIT}
            />
            <OperationButton
              className="operation"
              operation="+"
              dispatch={dispatch}
              type={ACTIONS.ADD_OPERATION}
            />
            <button
              onClick={() =>
                dispatch({
                  type: ACTIONS.NEGATE,
                  payload: { isRadians: isRad },
                })
              }
            >
              +/-
            </button>
            <DigitButton
              digit="0"
              isRadians={isRad}
              dispatch={dispatch}
              type={ACTIONS.ADD_DIGIT}
            />
            <DigitButton
              digit="."
              isRadians={isRad}
              dispatch={dispatch}
              type={ACTIONS.ADD_DIGIT}
            />
            <button
              id="equals"
              onClick={() =>
                dispatch({
                  type: ACTIONS.EVALUATE,
                  payload: { isRadians: isRad },
                })
              }
            >
              =
            </button>
          </>
        ) : null}
      </div>
      {isHistory ? (
        <div className="history">
          <button
            className="clearHistory"
            onClick={() => dispatch({ type: ACTIONS.CLEAR_HISTORY })}
          >
            Clear History
          </button>
          {state.history
            .slice()
            .reverse()
            .map((pastEval) => (
              <div className="pastContainer" key={propKey.current++}>
                <button
                  className="pastProblem"
                  onClick={() =>
                    dispatch({
                      type: ACTIONS.SELECT_PROBLEM,
                      payload: pastEval,
                    })
                  }
                >
                  {pastEval.problem}
                </button>
                <button
                  className="pastAnswer"
                  onClick={() =>
                    dispatch({
                      type: ACTIONS.SELECT_ANSWER,
                      payload: { answer: pastEval.answer },
                    })
                  }
                >
                  {pastEval.answer}
                </button>
              </div>
            ))}
        </div>
      ) : null}
    </div>
  );
}

export default App;
