import fs from 'fs';
import path from 'path';
import ora from 'ora';
import { handleSIGINT } from '../utils/fileUtils.js';

export default async function fixPathsCommand() {
    const configPath = path.join(process.cwd(), '.mkquizrc');
    if (!fs.existsSync(configPath)) {
        console.log('Configuration not found. Run `mkquiz config` first.');
        process.exit(1);
    }

    const spinner = ora('Checking JSON paths...');
    handleSIGINT(spinner);
    spinner.start();

    try {
        const { allQuizzezJsonPath } = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        const allQuizzes = JSON.parse(fs.readFileSync(allQuizzezJsonPath, 'utf-8'));
        let pathsFixed = 0;

        for (const yearData of allQuizzes) {
            const years = yearData.Year;
            for (const [year, subjects] of Object.entries(years)) {
                for (const [subjectName, examTypes] of Object.entries(subjects)) {
                    for (const [examType, quizzes] of Object.entries(examTypes)) {
                        for (const quiz of quizzes) {
                            if (quiz.path) {
                                const oldPath = quiz.path;
                                quiz.path = quiz.path.replace(/\\/g, '/');
                                if (!quiz.path.startsWith('/')) {
                                    quiz.path = '/' + quiz.path;
                                }
                                if (oldPath !== quiz.path) pathsFixed++;
                            }

                            if (quiz.JSON) {
                                const oldJson = quiz.JSON;
                                quiz.JSON = quiz.JSON.replace(/\\/g, '/');
                                if (!quiz.JSON.startsWith('/')) {
                                    quiz.JSON = '/' + quiz.JSON;
                                }
                                if (oldJson !== quiz.JSON) pathsFixed++;
                            }
                        }
                    }
                }
            }
        }

        fs.writeFileSync(allQuizzezJsonPath, JSON.stringify(allQuizzes, null, 4), 'utf-8');
        spinner.succeed(`Fixed ${pathsFixed} paths in the JSON file`);

    } catch (error) {
        spinner.fail(`Failed to fix paths: ${error.message}`);
    }
}