import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import ora from 'ora';
import { handleSIGINT } from '../utils/fileUtils.js';

export default async function configCommand() {
  let spinner = ora('Initializing configuration...');
  handleSIGINT(spinner);
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectPath',
      message: 'Enter the Quizzez project root path:',
      validate: (input) => (fs.existsSync(input) ? true : 'Path does not exist'),
    },
    {
      type: 'input',
      name: 'allQuizzezJsonPath',
      message: 'Enter the all Quizzez JSON path:',
      validate: (input) =>
        fs.existsSync(input) && path.extname(input) === '.json'
          ? true
          : 'Path does not exist or not a valid json',
    },
    {
      type: 'input',
      name: 'templateFile',
      message: 'Enter path to template.html file:',
      validate: (input) =>
        fs.existsSync(input) && path.extname(input) === '.html'
          ? true
          : 'Valid .html file required',
    },
  ]);

  spinner = ora('Saving configuration...').start();
  const configPath = path.join(process.cwd(), '.mkquizrc');

  fs.writeFileSync(configPath, JSON.stringify(answers, null, 2));
  spinner.succeed('Configuration saved');
}
