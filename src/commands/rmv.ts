import inquirer from 'inquirer';
import ora from 'ora';
import type { Ora } from 'ora';
import { rmvQuizFolder, handleSIGINT } from '../utils/fileUtils';
import { loadAndValidateConfig } from '../utils/configManager';
import { loadAllQuizzes, saveAllQuizzes, removeQuizFromStructure, getQuizzesForYear } from '../utils/jsonUtils';
import { YearOption, SelectedQuizValue } from '../types';
import { MkquizError, QuizOperationError } from '../utils/errors';
import log from '../utils/logger';

type YearAnswer = { year: YearOption };
type QuizSelectAnswer = { selectedQuizzes: SelectedQuizValue[] };
type ConfirmAnswer = { confirm: boolean };

/**
 * Remove command - Removes existing quizzes from the project
 */
export default async function rmvCommand(): Promise<void> {
    let spinner: Ora = ora();
    handleSIGINT(spinner);

    try {
        log.info('Starting remove quiz command');

        
        const config = loadAndValidateConfig();
        const { projectPath, allQuizzezJsonPath } = config;

        
        const allQuizzes = loadAllQuizzes(allQuizzezJsonPath);

        
        const yearAnswer = await inquirer.prompt<YearAnswer>([
            {
                type: 'list',
                name: 'year',
                message: 'Select year:',
                choices: ['1st', '2nd', '3rd', '4th'],
            },
        ]);

        const selectedYear = yearAnswer.year;
        const yearData = getQuizzesForYear(allQuizzes, selectedYear);

        if (!yearData) {
            log.info(`No quizzes found for ${selectedYear} year`);
            console.log(`No quizzes found for ${selectedYear} year.`);
            process.exit(0);
        }

        
        const choices: { name: string; value: SelectedQuizValue }[] = [];

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

        if (choices.length === 0) {
            log.info(`No quizzes available for ${selectedYear}`);
            console.log(`No quizzes available for ${selectedYear}.`);
            process.exit(0);
        }

        
        const quizAnswer = await inquirer.prompt<QuizSelectAnswer>([
            {
                type: 'checkbox',
                name: 'selectedQuizzes',
                message: 'Select quizzes to remove:',
                choices,
            },
        ]);
        console.log(quizAnswer.selectedQuizzes);
        if (!quizAnswer.selectedQuizzes || quizAnswer.selectedQuizzes.length === 0) {
            log.info('No quizzes selected for removal');
            console.log('No quizzes selected for removal.');
            process.exit(0);
        }

        
        const quizNames = quizAnswer.selectedQuizzes
            .map((q) => `${q.subject} - ${q.examType} - ${q.quizType}`)
            .join('\n  ');

        const confirmAnswer = await inquirer.prompt<ConfirmAnswer>([
            {
                type: 'confirm',
                name: 'confirm',
                message: `Are you sure you want to remove these quizzes?\n  ${quizNames}\n`,
                default: false,
            },
        ]);

        if (!confirmAnswer.confirm) {
            log.info('Quiz removal cancelled by user');
            console.log('Operation cancelled.');
            process.exit(0);
        }

        spinner = ora('Removing quizzes...').start();

        
        for (const quiz of quizAnswer.selectedQuizzes) {
            log.debug('Removing quiz', { quiz });

            
            if (quiz.path) {
                await rmvQuizFolder(projectPath, quiz.path);
            }

            
            removeQuizFromStructure(
                allQuizzes,
                selectedYear,
                quiz.subject,
                quiz.examType,
                quiz.quizType
            );

            spinner.text = `Removed ${quiz.subject} - ${quiz.examType} - ${quiz.quizType}`;
        }

        
        saveAllQuizzes(allQuizzezJsonPath, allQuizzes);

        spinner.succeed(`Successfully removed ${quizAnswer.selectedQuizzes.length} quiz(es)`);
        log.success(`Removed ${quizAnswer.selectedQuizzes.length} quiz(es) successfully`);
    } catch (error) {
        spinner.fail('Failed to remove quizzes');

        if (error instanceof MkquizError) {
            log.error(error.message);
        } else {
            log.error('Unexpected error during quiz removal', error);
        }

        process.exit(1);
    }
}
