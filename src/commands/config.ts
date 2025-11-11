import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import ora from 'ora';
import type { Ora } from 'ora';
import { handleSIGINT } from '../utils/fileUtils';
import { saveConfig } from '../utils/configManager';
import { ConfigAnswers } from '../types';
import { MkquizError } from '../utils/errors';
import log from '../utils/logger';

/**
 * Config command - Sets up the mkquiz configuration
 */
export default async function configCommand(): Promise<void> {
    let spinner: Ora = ora('Initializing configuration...');
    handleSIGINT(spinner);

    try {
        log.info('Starting configuration setup');

        const answers = await inquirer.prompt<ConfigAnswers>([
            {
                type: 'input',
                name: 'projectPath',
                message: 'Enter the Quizzez project root path:',
                validate: (input: string) => {
                    if (!fs.existsSync(input)) {
                        return 'Path does not exist';
                    }
                    return true;
                },
            },
            {
                type: 'input',
                name: 'allQuizzezJsonPath',
                message: 'Enter the all Quizzez JSON path:',
                validate: (input: string) => {
                    if (!fs.existsSync(input)) {
                        return 'Path does not exist';
                    }
                    if (path.extname(input) !== '.json') {
                        return 'Not a valid .json file';
                    }
                    return true;
                },
            },
            {
                type: 'input',
                name: 'templateFile',
                message: 'Enter path to template.html file:',
                validate: (input: string) => {
                    if (!fs.existsSync(input)) {
                        return 'Path does not exist';
                    }
                    if (path.extname(input) !== '.html') {
                        return 'Valid .html file required';
                    }
                    return true;
                },
            },
        ]);

        spinner = ora('Saving configuration...').start();

        saveConfig({
            projectPath: answers.projectPath,
            templateFile: answers.templateFile,
            allQuizzezJsonPath: answers.allQuizzezJsonPath,
        });

        spinner.succeed('Configuration saved successfully');
        log.success('Configuration setup completed');
    } catch (error) {
        spinner.fail('Configuration setup failed');
        
        if (error instanceof MkquizError) {
            log.error(error.message);
        } else {
            log.error('Unexpected error during configuration', error);
        }
        
        process.exit(1);
    }
}
