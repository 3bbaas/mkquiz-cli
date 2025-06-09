import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import ora from 'ora';
import { rmvQuizFolder } from '../utils/fileUtils.js';
import { handleSIGINT } from '../utils/fileUtils.js';

export default async function rmvCommand() {
  let spinner = ora();
  handleSIGINT(spinner);
  const configPath = path.join(process.cwd(), '.mkquizrc');
  if (!fs.existsSync(configPath)) {
    console.log('Configuration not found. Run `mkquiz config` first.');
    process.exit(1);
  }

  const { projectPath, allQuizzezJsonPath } = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const allQuizzes = JSON.parse(fs.readFileSync(allQuizzezJsonPath, 'utf-8'));
  const yearAnswer = await inquirer.prompt([
    {
      type: 'list',
      name: 'year',
      message: 'Select year:',
      choices: ['1st', '2nd', '3rd', '4th'],
    },
  ]);

  const selectedYear = yearAnswer.year;
  const yearData = allQuizzes[0].Year[selectedYear];

  if (!yearData) {
    console.log(`No quizzes found for ${selectedYear} year.`);
    process.exit(1);
  }
  const choices = [];
  for (const [subject, examTypes] of Object.entries(yearData)) {
    for (const [examType, quizzes] of Object.entries(examTypes)) {
      for (const quiz of quizzes) {
        choices.push({
          name: `${subject} - ${examType} - ${quiz.type}`,
          value: {
            subject,
            examType,
            quizType: quiz.type,
            path: quiz.path,
            JSON: quiz.JSON,
          },
        });
      }
    }
  }

  const quizAnswer = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedQuizzes',
      message: 'Select quizzes to remove:',
      choices,
    },
  ]);

  if (quizAnswer.selectedQuizzes.length === 0) {
    console.log('No quizzes selected for removal.');
    process.exit(0);
  }

  const quizNames = quizAnswer.selectedQuizzes
    .map((q) => `${q.subject} - ${q.examType} - ${q.quizType}`)
    .join('\n  ');
  const confirmAnswer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: `Are you sure you want to remove these quizzes?\n  ${quizNames}\n`,
      default: false,
    },
  ]);

  if (!confirmAnswer.confirm) {
    console.log('Operation cancelled.');
    process.exit(0);
  }

  spinner = ora('Removing quizzes...').start();

  try {
    for (const quiz of quizAnswer.selectedQuizzes) {
      const quizFolderPath = path.join(
        projectPath,
        'quizzes',
        selectedYear,
        quiz.examType.toLowerCase(),
        quiz.subject.toLowerCase().replace(/\s+/g, '_'),
      );
      await rmvQuizFolder(projectPath, quiz.path);

      const yearQuizzes = allQuizzes[0].Year[selectedYear][quiz.subject][quiz.examType];
      const quizIndex = yearQuizzes.findIndex((q) => q.type === quiz.quizType);
      if (quizIndex !== -1) {
        yearQuizzes.splice(quizIndex, 1);
      }
      if (yearQuizzes.length === 0) {
        delete allQuizzes[0].Year[selectedYear][quiz.subject][quiz.examType];
      }

      if (Object.keys(allQuizzes[0].Year[selectedYear][quiz.subject]).length === 0) {
        delete allQuizzes[0].Year[selectedYear][quiz.subject];
      }

      spinner.text = `Removed ${quiz.subject} - ${quiz.examType} - ${quiz.quizType}`;
    }

    fs.writeFileSync(allQuizzezJsonPath, JSON.stringify(allQuizzes, null, 4), 'utf-8');

    spinner.succeed(`Successfully removed ${quizAnswer.selectedQuizzes.length} quiz(es)`);
  } catch (error) {
    spinner.fail(error.message);
  }
}
