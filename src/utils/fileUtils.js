import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';

export async function copyJSONToTarget(quizFolderPath, sourceJson, quizName) {
  const sanitizedName =
    quizName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_') + '.json';
  const destPath = path.join(quizFolderPath, sanitizedName);
  fs.copyFileSync(sourceJson, destPath);
  return destPath;
}

export async function ensureQuizFolder(projectPath, year, quizFor, quizName, spinner) {
  const sanitized = quizName.trim().toLowerCase().replace(/\s+/g, '_');
  const destDir = path.join(projectPath, 'quizzes', year, quizFor.toLowerCase(), sanitized);

  if (fs.existsSync(destDir)) {
    spinner.stop();
    const answer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'remove',
        message: `Folder ${year}/${quizFor}/${quizName} exists. Remove and continue?`,
        default: false,
      },
    ]);
    spinner.start();
    if (!answer.remove) {
      console.log('Quiz creation aborted by user.');
      return null;
    }
    fs.rmSync(destDir, { recursive: true, force: true });
  }

  fs.mkdirSync(destDir, { recursive: true });
  return destDir;
}

export async function rmvQuizFolder(projectPath, quizPath) {
  const destDir = path.join(projectPath, quizPath);
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true, force: true });
  }

  return destDir;
}

export function handleSIGINT(spinner = null) {
  process.on('SIGINT', () => {
    if (spinner) {
      spinner.stop();
    }
    console.log('\nOperation cancelled by user');
    process.exit(0);
  });
}
