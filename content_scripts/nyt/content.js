'use strict';

const LETTER_KEY_CODE_LIMITS = [65, 90];
const BACKSPACE_KEY_CODE = 8;
const WORDLE_LENGTH = 5;

(function NytContent() {
  let gameState
  let wordAttempt = ""

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

    if (keyCode >= LETTER_KEY_CODE_LIMITS[0] && keyCode <= LETTER_KEY_CODE_LIMITS[1]) {
      if (wordAttempt.length >= WORDLE_LENGTH) return;

      wordAttempt += key;
    } else if (keyCode === BACKSPACE_KEY_CODE) {
      wordAttempt = wordAttempt.slice(0, -1)
    }
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

  const validateKnownPositions = () => {
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

  const validateWordAttempt = () => {
    if (!validateKnownPositions()) {
      console.log("USING KNOWN LETTER OUTSIDE POSITION")
    }
  }

  const updateGameState = (event) => {
    parseStorageToState();
    updateWordAttempt(event);

    validateWordAttempt();
  }

  window.addEventListener('keyup', updateGameState)
}())
