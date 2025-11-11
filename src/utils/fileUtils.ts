import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import type { Ora } from 'ora';
import { FileSystemError } from './errors';
import { buildJsonPath, buildQuizFolderPath } from './pathUtils';
import log from './logger';

type InquirerRemoveAnswer = { remove: boolean };


export async function copyJSONToTarget(
    quizFolderPath: string,
    sourceJson: string,
    quizName: string
): Promise<string> {
    try {
        const destPath = buildJsonPath(quizFolderPath, quizName);
        fs.copyFileSync(sourceJson, destPath);
        log.debug('JSON file copied', { source: sourceJson, destination: destPath });
        return destPath;
    } catch (error) {
        log.error('Failed to copy JSON file', error, { source: sourceJson, dest: quizFolderPath });
        throw new FileSystemError(
            `Failed to copy JSON file: ${(error as Error).message}`,
            sourceJson
        );
    }
}


export async function ensureQuizFolder(
    projectPath: string,
    year: string,
    quizFor: string,
    quizName: string,
    spinner?: Ora | null
): Promise<string | null> {
    try {
        const destDir = buildQuizFolderPath(projectPath, year, quizFor, quizName);

        if (fs.existsSync(destDir)) {
            try {
                spinner?.stop();
            } catch {
                // Ignore spinner errors
            }

            const answer = await inquirer.prompt<InquirerRemoveAnswer>([
                {
                    type: 'confirm',
                    name: 'remove',
                    message: `Folder ${year}/${quizFor}/${quizName} exists. Remove and continue?`,
                    default: false,
                },
            ]);

            try {
                spinner?.start();
            } catch {
                // Ignore spinner errors
            }

            if (!answer.remove) {
                log.info('Quiz creation aborted by user');
                return null;
            }

            removeDirectory(destDir);
        }

        createDirectory(destDir);
        log.debug('Quiz folder ensured', { path: destDir });
        return destDir;
    } catch (error) {
        log.error('Failed to ensure quiz folder', error, { projectPath, year, quizFor, quizName });
        throw new FileSystemError(
            `Failed to create quiz folder: ${(error as Error).message}`,
            projectPath
        );
    }
}


export async function rmvQuizFolder(projectPath: string, quizPath: string): Promise<string> {
    try {
        const destDir = path.join(projectPath, quizPath);
        if (fs.existsSync(destDir)) {
            fs.rmSync(destDir, { recursive: true, force: true });
            log.debug('Quiz folder removed', { path: destDir });
        }
        return destDir;
    } catch (error) {
        log.error('Failed to remove quiz folder', error, { path: quizPath });
        throw new FileSystemError(
            `Failed to remove quiz folder: ${(error as Error).message}`,
            quizPath
        );
    }
}


export function createDirectory(dirPath: string): void {
    try {
        fs.mkdirSync(dirPath, { recursive: true });
        log.debug('Directory created', { path: dirPath });
    } catch (error) {
        log.error('Failed to create directory', error, { path: dirPath });
        throw new FileSystemError(
            `Failed to create directory: ${(error as Error).message}`,
            dirPath
        );
    }
}


export function removeDirectory(dirPath: string): void {
    try {
        if (fs.existsSync(dirPath)) {
            fs.rmSync(dirPath, { recursive: true, force: true });
            log.debug('Directory removed', { path: dirPath });
        }
    } catch (error) {
        log.error('Failed to remove directory', error, { path: dirPath });
        throw new FileSystemError(
            `Failed to remove directory: ${(error as Error).message}`,
            dirPath
        );
    }
}


export function writeFile(filePath: string, content: string): void {
    try {
        fs.writeFileSync(filePath, content, 'utf-8');
        log.debug('File written', { path: filePath });
    } catch (error) {
        log.error('Failed to write file', error, { path: filePath });
        throw new FileSystemError(
            `Failed to write file: ${(error as Error).message}`,
            filePath
        );
    }
}


export function readFile(filePath: string): string {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        log.debug('File read', { path: filePath });
        return content;
    } catch (error) {
        log.error('Failed to read file', error, { path: filePath });
        throw new FileSystemError(
            `Failed to read file: ${(error as Error).message}`,
            filePath
        );
    }
}


export function handleSIGINT(spinner?: Ora | null): void {
    if (!process.listenerCount('SIGINT')) {
        process.on('SIGINT', () => {
            try {
                if (spinner) {
                    spinner.stop();
                }
            } catch {
                // Ignore spinner errors
            }
            log.info('Operation cancelled by user');
            process.exit(0);
        });
    }
}
