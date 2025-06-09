// Load the JSON (e.g. from fetch or fs)
const rawData = require('D:/vs/Repos/mkquiz/temp.json'); // or from fetch in browser

const quizzesList = [];

// Recursive function to extract quiz arrays
function extractQuizzes(obj) {
  if (Array.isArray(obj)) {
    // Found a list of quizzes
    quizzesList.push(...obj);
  } else if (typeof obj === 'object' && obj !== null) {
    // Dive deeper
    for (const key in obj) {
      extractQuizzes(obj[key]);
    }
  }
}

// Start from the root
extractQuizzes(rawData);

console.log(quizzesList);
