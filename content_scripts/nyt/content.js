'use strict';

const LETTER_KEY_CODE_LIMITS = { min: 65, max: 90 };
const BACKSPACE_KEY_CODE = 8;
const WORDLE_LENGTH = 5;

(function NytContent() {
  let gameState
  let wordAttempt = ""
  let alertsWrapperEl = document.createElement('div');
  document.body.appendChild(alertsWrapperEl)

  const readLocalStorage = () => {
    const value = localStorage.getItem('nyt-wordle-state')
    return JSON.parse(value)
  }

  const parseStorageToState = () => {
    const storedState = readLocalStorage()
    if (!storedState) return;

    const { boardState, evaluations } = storedState;
    gameState = evaluations.map((row, rowIndex) => {
      if (!row) return null;

      return row.map((col, colIndex) => ({
        letter: boardState[rowIndex][colIndex],
        value: col
      }))
    })
  }

  const updateWordAttempt = (event) => {
    const { key, keyCode } = event;

    if (keyCode >= LETTER_KEY_CODE_LIMITS.min && keyCode <= LETTER_KEY_CODE_LIMITS.max) {
      if (wordAttempt.length >= WORDLE_LENGTH) return;

      wordAttempt += key;
    } else if (keyCode === BACKSPACE_KEY_CODE) {
      wordAttempt = wordAttempt.slice(0, -1)
    }
  }

  const buildAlertsDiv = (validations) => {
    const violations = validations.filter(validation => !validation.isValid)
    if (!violations.length) return '';

    return `
      <div class="alert errors-alert">
        <h2>Watch out!</h2>
        Check out the following before continuing:
        <ul clas="errors-wrapper">
          ${violations.map(violation => `<li class=${violation.type}><span class="tile-color"></span>${violation.message}</li>`).join('')}
        </ul>
      </div>
    `
  }

  const validateAbsentLetters = () => {
    const absentLetters = new Set();
    gameState.forEach(row => {
      if (!row) return;

      row.forEach(col => {
        if (col.value === 'absent') absentLetters.add(col.letter)
      })
    })

    return !wordAttempt.split("").find(letter => absentLetters.has(letter))
  }

  const validateCorrectPositions = () => {
    let knownPositions = new Set();
    gameState.forEach(row => {
      if (!row) return;

      row.forEach((col, index) => {
        if (col.value === 'correct') knownPositions.add({...col, position: index})
      })
    })

    let result = true;
    knownPositions.forEach(knownPosition => {
      const { letter, position } = knownPosition;
      if (!wordAttempt[position]) return;

      result = result && (letter === wordAttempt[position])
    })

    return result
  }

  const validatePresentLetters = () => {
    let presentLetters = new Set();
    gameState.forEach(row => {
      if (!row) return;

      row.forEach((col, index) => {
        if (col.value === 'present') presentLetters.add({...col, position: index})
      })
    })

    let result = true;
    presentLetters.forEach(presentLetter => {
      const { letter, position } = presentLetter;
      if (!wordAttempt[position]) return;

      result = result && (letter !== wordAttempt[position])
      if (wordAttempt.length === WORDLE_LENGTH) result = result && wordAttempt.includes(letter)
    })

    return result
  }

  const runValidations = () => {
    const validations = [{
      type: "absent",
      isValid: validateAbsentLetters(),
      message: "You typed a letter that isn't at any spot in the word",
    }, {
      type: "correct",
      isValid: validateCorrectPositions(),
      message: "You forgot a letter that is in the word and its position is known",
    }, {
      type: "present",
      isValid: validatePresentLetters(),
      message: "You typed (or forgot to type) a letter that is in the word but the position is wrong"
    }]

    alertsWrapperEl.innerHTML = buildAlertsDiv(validations);
  }

  const updateGameState = (event) => {
    parseStorageToState();
    updateWordAttempt(event);

    runValidations();
  }

  window.addEventListener('keyup', updateGameState)
}())
