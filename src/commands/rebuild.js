import fs from 'fs';
import path from 'path';
import ora from 'ora';
import { processTemplate } from '../lib/templateProcessor.js';
import { handleSIGINT } from '../utils/fileUtils.js';
import { quizzes } from '../utils/json.js';

export default async function rebuildCommand() {
  const spinner = ora('Rebuilding all quizzes...');
  spinner.start();
  handleSIGINT(spinner);
  const configPath = path.join(process.cwd(), '.mkquizrc');

  if (!fs.existsSync(configPath)) {
    console.log('Configuration not found. Run `mkquiz config` first.');
    process.exit(1);
  }

  const { projectPath, allQuizzezJsonPath, templateFile } = JSON.parse(
    fs.readFileSync(configPath, 'utf-8'),
  );

  const now = new Date();
  const hour = now.getHours().toString().padStart(2, '0');
  const minute = now.getMinutes().toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');

  fs.writeFileSync(
    path.join(
      path.dirname(allQuizzezJsonPath),
      `backup_nav_H${hour}_m${minute}_D${day}_M${month}.json`,
    ),
    JSON.stringify(JSON.parse(fs.readFileSync(allQuizzezJsonPath, 'utf-8')), null, 2),
  );

  const allQuizzes = JSON.parse(fs.readFileSync(allQuizzezJsonPath, 'utf-8'));
  // const allQuizzes = quizzes;

  const stats = {
    total: 0,
    byYear: {},
    byType: {},
  };

  try {
    let quizzez = [];
    const countQuiz = (item) => {
      return quizzez.reduce((count, x) => (x === item ? count + 1 : count), 0);
    };

    function normalizeQuizPath(fullPath) {
      const normalized = fullPath.replace(/\\/g, '/');
      const match = normalized.match(/\/quizzes\/.*$/);
      return match ? match[0] : null;
    }

    for (const yearData of allQuizzes) {
      const years = yearData.Year;
      for (const [year, subjects] of Object.entries(years)) {
        if (!stats.byYear[year]) {
          stats.byYear[year] = 0;
        }

        for (const [subjectName, examTypes] of Object.entries(subjects)) {
          for (const [examType, quizzes] of Object.entries(examTypes)) {
            for (const quiz of quizzes) {
              try {
                const quizName =
                  subjectName +
                  ' ' +
                  quiz.type +
                  (countQuiz(subjectName + ' ' + quiz.type)
                    ? countQuiz(subjectName + ' ' + quiz.type) + 1
                    : '');
                quizzez.push(subjectName + ' ' + quiz.type);
                spinner.text = `Processing: ${year} - ${subjectName} - ${quiz.type}`;

                const sanitized = quizName.trim().toLowerCase().replace(/\s+/g, '_');
                const quizFolderPath = path.join(
                  projectPath,
                  'quizzes',
                  year.toLowerCase(),
                  examType.toLowerCase(),
                  sanitized,
                );

                const sanitizedSubject = quizName.trim().toLowerCase().replace(/\s+/g, '_');
                const absoluteJsonPath = path.join(quizFolderPath, `${sanitizedSubject}.json`);
                const newJsonPath = normalizeQuizPath(absoluteJsonPath);

                const oldJsonPath = path.join(projectPath, quiz.JSON);
                // console.log(oldJsonPath);
                if (fs.existsSync(oldJsonPath)) {
                  const jsonContent = JSON.parse(fs.readFileSync(oldJsonPath, 'utf-8'));
                  if (fs.existsSync(quizFolderPath)) {
                    fs.rmSync(quizFolderPath, { recursive: true, force: true });
                  }
                  const questionsCount = Array.isArray(jsonContent) ? jsonContent.length : 0;
                  fs.mkdirSync(path.dirname(absoluteJsonPath), {
                    recursive: true,
                  });

                  try {
                    fs.writeFileSync(absoluteJsonPath, JSON.stringify(jsonContent, null, 2));
                  } catch (error) {
                    console.error(`Error writing JSON file: ${absoluteJsonPath}`, error);
                    continue;
                  }

                  const indexHtml = processTemplate(templateFile, {
                    quizName: quizName,
                    quizFor: examType,
                    questionsCount: questionsCount,
                    duration: parseInt((questionsCount / 10) * 4) + 1,
                    jsonPath: newJsonPath,
                  });

                  fs.writeFileSync(path.join(quizFolderPath, 'index.html'), indexHtml, 'utf-8');

                  quiz.path = normalizeQuizPath(quizFolderPath);
                  quiz.JSON = newJsonPath;

                  stats.total++;
                  stats.byYear[year]++;
                  if (!stats.byType[quiz.type]) {
                    stats.byType[quiz.type] = 0;
                  }
                  stats.byType[quiz.type]++;
                } else {
                  console.error(`Source JSON file not found: ${oldJsonPath}`);
                }

                // spinner.text = `Completed: ${year} - ${quizName} - ${examType}`;
              } catch (error) {
                console.error(`Error processing quiz: ${subjectName} ${quiz.type}`, error);
              }
            }
          }
        }
      }
    }

    fs.writeFileSync(allQuizzezJsonPath, JSON.stringify(allQuizzes, null, 4), 'utf-8');

    spinner.succeed('All quizzes rebuilt successfully');
    console.log('\nRebuild Statistics:');
    for (const [year, count] of Object.entries(stats.byYear)) {
      console.log(`${year} year quizzes = ${count}`);
    }
    console.log('\nBy Quiz Type:');
    for (const [type, count] of Object.entries(stats.byType)) {
      console.log(`${type} quizzes = ${count}`);
    }
    console.log(`\nTotal quizzes = ${stats.total}`);
    console.log(`\nJSON file updated: ${allQuizzezJsonPath}`);
  } catch (error) {
    spinner.fail(`Failed to rebuild quizzes: ${error.message}`);
  }
}
