import inquirer from 'inquirer';
import path from 'path';
import ora from 'ora';
import { processTemplate } from '../lib/templateProcessor';
import { copyJSONToTarget, ensureQuizFolder, handleSIGINT, writeFile } from '../utils/fileUtils';
import { loadAndValidateConfig } from '../utils/configManager';
import { 
    loadAllQuizzes, 
    saveAllQuizzes, 
    addQuizToStructure, 
    getExistingQuizzes, 
    countQuizzesByName 
} from '../utils/jsonUtils';
import { validateQuizJsonFile } from '../utils/validation';
import { normalizeQuizPath } from '../utils/pathUtils';
import { OraSpinner, AddQuizAnswers, QuizData } from '../types';
import { MkquizError, QuizOperationError } from '../utils/errors';
import log from '../utils/logger';

/**
 * Add command - Adds a new quiz to the project
 */
export default async function addCommand(): Promise<void> {
    let spinner: OraSpinner = ora();
    handleSIGINT(spinner);

    try {
        log.info('Starting add quiz command');

        
        const config = loadAndValidateConfig();
        const { projectPath, templateFile, allQuizzezJsonPath } = config;

        
        const allQuizzes = loadAllQuizzes(allQuizzezJsonPath);

        
        const answers = await inquirer.prompt<AddQuizAnswers>([
            {
                type: 'input',
                name: 'quizName',
                message: 'Quiz name (e.g. Computer Arch):',
                validate: (input: string) => {
                    if (input.trim() === '') {
                        return 'Name cannot be empty';
                    }
                    return true;
                },
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
                validate: (input: string) => {
                    try {
                        validateQuizJsonFile(input);
                        return true;
                    } catch (error) {
                        return (error as Error).message;
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

        
        const quizQuestions = validateQuizJsonFile(answers.jsonPath);
        const questionsCount = quizQuestions.length;
        log.info(`Loaded ${questionsCount} questions from JSON file`);

        
        const existingQuizzes = getExistingQuizzes(
            allQuizzes,
            answers.year,
            answers.quizName,
            answers.quizFor
        );

        const baseQuizName = `${answers.quizName} ${answers.questionType}`;
        const count = countQuizzesByName(existingQuizzes, baseQuizName);
        const suffix = count > 0 ? String(count + 1) : '';
        const quizName = baseQuizName + suffix;

        log.debug('Quiz naming determined', { baseQuizName, count, quizName });

        
        const quizFolderPath = await ensureQuizFolder(
            projectPath,
            answers.year,
            answers.quizFor,
            quizName,
            spinner
        );

        if (!quizFolderPath) {
            throw new QuizOperationError('User cancelled quiz creation');
        }

        
        const jsonTargetPath = await copyJSONToTarget(
            quizFolderPath,
            answers.jsonPath,
            `${answers.quizName}_${answers.questionType}`
        );

        
        const duration = Math.floor((questionsCount / 10) * 4) + 1;

        
        const indexHtml = processTemplate(templateFile, {
            quizName: answers.quizName,
            quizFor: answers.quizFor,
            questionsCount,
            duration,
            jsonPath: normalizeQuizPath(jsonTargetPath),
        });

        
        writeFile(path.join(quizFolderPath, 'index.html'), indexHtml);

        
        const quizData: QuizData = {
            type: answers.questionType,
            path: normalizeQuizPath(quizFolderPath),
            published: answers.published,
            JSON: normalizeQuizPath(jsonTargetPath),
        };

        addQuizToStructure(
            allQuizzes,
            answers.year,
            answers.quizName,
            answers.quizFor,
            quizData
        );

        
        saveAllQuizzes(allQuizzezJsonPath, allQuizzes);

        spinner.succeed(`Quiz "${answers.quizName}" added successfully with ${questionsCount} questions`);
        log.success('Quiz added successfully', {
            name: answers.quizName,
            year: answers.year,
            type: answers.questionType,
            questions: questionsCount,
        });
    } catch (error) {
        spinner.fail('Failed to add quiz');

        if (error instanceof MkquizError) {
            log.error(error.message);
        } else {
            log.error('Unexpected error during quiz addition', error);
        }

        process.exit(1);
    }
}
