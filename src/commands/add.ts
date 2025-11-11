import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import ora from 'ora';
import { processTemplate } from '../lib/templateProcessor.js';
import { copyJSONToTarget, ensureQuizFolder, handleSIGINT } from '../utils/fileUtils.js';

export default async function addCommand() {
  let spinner = ora();
  handleSIGINT(spinner);
  const configPath = path.join(process.cwd(), '.mkquizrc');

  if (!fs.existsSync(configPath)) {
    console.log('Configuration not found. Run `mkquiz config` first.');
    process.exit(1);
  }

  const { projectPath, templateFile, allQuizzezJsonPath } = JSON.parse(
    fs.readFileSync(configPath, 'utf-8'),
  );
  const allQuizzes = JSON.parse(fs.readFileSync(allQuizzezJsonPath, 'utf-8'));

  let quizzez = [];
  const countQuiz = (item) => {
    return quizzez.reduce((count, x) => (x === item ? count + 1 : count), 0);
  };

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'quizName',
      message: 'Quiz name (e.g. Computer Arch):',
      validate: (input) => (input.trim() !== '' ? true : 'Name cannot be empty'),
    },
    {
      type: 'list',
      name: 'quizFor',
      message: 'Quiz for:',
      choices: ['Midterm', 'Final'],
    },
    {
      type: 'list',
      name: 'questionType',
      message: 'Type of questions:',
      choices: ['MCQ', 'TF', 'QB'],
    },
    {
      type: 'list',
      name: 'year',
      message: 'Quiz for year:',
      choices: ['1st', '2nd', '3rd', '4th'],
    },
    {
      type: 'input',
      name: 'jsonPath',
      message: 'Path to quiz JSON file:',
      validate: (input) => {
        if (!fs.existsSync(input) || path.extname(input) !== '.json') {
          return 'Valid .json file required';
        }
        try {
          const jsonContent = JSON.parse(fs.readFileSync(input, 'utf-8'));
          if (!Array.isArray(jsonContent)) {
            return 'JSON file must contain an array of questions';
          }

          for (let i = 0; i < jsonContent.length; i++) {
            const question = jsonContent[i];
            if (!question.question || typeof question.question !== 'string') {
              return `Question at index ${i} is missing or has invalid 'question' property`;
            }
            if (!question.options || typeof question.options !== 'object') {
              return `Question at index ${i} is missing or has invalid 'options' property`;
            }
            if (!question.answer || typeof question.answer !== 'string') {
              return `Question at index ${i} is missing or has invalid 'answer' property`;
            }
            if (!question.id || typeof question.id !== 'number') {
              return `Question at index ${i} is missing or has invalid 'id' property`;
            }
            if (question.options) {
              const optionsKeys = Object.keys(question.options);
              if (optionsKeys.length === 0) {
                return `Question at index ${i} has empty options`;
              }
              if (
                optionsKeys.length === 2 &&
                optionsKeys.includes('a') &&
                optionsKeys.includes('b') &&
                question.options.a === 'True' &&
                question.options.b === 'False'
              ) {
                continue;
              }
              if (optionsKeys.length < 2) {
                return `Question at index ${i} must have at least 2 options`;
              }
              if (!optionsKeys.every((key) => typeof question.options[key] === 'string')) {
                return `Question at index ${i} has invalid option values`;
              }
            }
          }
          return true;
        } catch (error) {
          return 'Invalid JSON file: ' + error.message;
        }
      },
    },
    {
      type: 'confirm',
      name: 'published',
      message: 'Published?',
      default: true,
    },
  ]);

  spinner = ora('Processing quiz...').start();
  try {
    const jsonContent = JSON.parse(fs.readFileSync(answers.jsonPath, 'utf-8'));
    const questionsCount = jsonContent.length;

    const baseQuizName = answers.quizName + ' ' + answers.questionType;
    quizzez =
      allQuizzes[0].Year[answers.year]?.[answers.quizName]?.[answers.quizFor]?.map(
        (q) => answers.quizName + ' ' + q.type,
      ) || [];
    const quizName = baseQuizName + (countQuiz(baseQuizName) ? countQuiz(baseQuizName) + 1 : '');
    quizzez.push(baseQuizName);

    const quizFolderPath = await ensureQuizFolder(
      projectPath,
      answers.year,
      answers.quizFor,
      quizName,
      spinner,
    );
    const jsonTargetPath = await copyJSONToTarget(
      quizFolderPath,
      answers.jsonPath,
      answers.quizName + '_' + answers.questionType,
    );

    function normalizeQuizPath(fullPath) {
      const normalized = fullPath.replace(/\\/g, '/');
      const match = normalized.match(/\/quizzes\/.*$/);
      return match ? match[0] : null;
    }

    const indexHtml = processTemplate(templateFile, {
      quizName: answers.quizName,
      quizFor: answers.quizFor,
      questionsCount: questionsCount,
      duration: parseInt((questionsCount / 10) * 4) + 1,
      jsonPath: normalizeQuizPath(jsonTargetPath),
    });

    fs.writeFileSync(path.join(quizFolderPath, 'index.html'), indexHtml, 'utf-8');

    if (!allQuizzes[0].Year[answers.year]) {
      allQuizzes[0].Year[answers.year] = {};
    }

    if (!allQuizzes[0].Year[answers.year][answers.quizName]) {
      allQuizzes[0].Year[answers.year][answers.quizName] = {};
    }

    if (!allQuizzes[0].Year[answers.year][answers.quizName][answers.quizFor]) {
      allQuizzes[0].Year[answers.year][answers.quizName][answers.quizFor] = [];
    }

    const sanitizedQuizName = answers.quizName.trim().toLowerCase().replace(/\s+/g, '_');
    const quizData = {
      type: answers.questionType,
      path: normalizeQuizPath(quizFolderPath),
      published: answers.published,
      JSON: normalizeQuizPath(jsonTargetPath),
    };

    allQuizzes[0].Year[answers.year][answers.quizName][answers.quizFor].push(quizData);

    fs.writeFileSync(allQuizzezJsonPath, JSON.stringify(allQuizzes, null, 4), 'utf-8');

    spinner.succeed(`Quiz ${answers.quizName} added successfully with ${questionsCount} questions`);
  } catch (error) {
    spinner.fail(error.message);
  }
}
