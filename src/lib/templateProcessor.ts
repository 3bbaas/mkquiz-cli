import { TemplateVars } from '../types';
import { TemplateError } from '../utils/errors';
import { readFile } from '../utils/fileUtils';
import log from '../utils/logger';


export function processTemplate(templatePath: string, vars: TemplateVars): string {
    try {
        log.debug('Processing template', { templatePath, vars });
        
        let content = readFile(templatePath);
        
        
        content = content.replace(/\{\%\s*Quiz Name\s*\%\}/g, String(vars.quizName));
        content = content.replace(/\{\%\s*Final\/Midterm Sheet\s*\%\}/g, String(vars.quizFor));
        content = content.replace(/\{\%\s*N\s*\%\}/g, String(vars.questionsCount));
        content = content.replace(/\{\%\s*T\s*\%\}/g, String(vars.duration));
        content = content.replace(/\{\%\s*JSON Path\s*\%\}/g, String(vars.jsonPath ?? ''));

        log.debug('Template processed successfully');
        return content;
    } catch (error) {
        log.error('Failed to process template', error, { templatePath });
        throw new TemplateError(
            `Failed to process template: ${(error as Error).message}`,
            templatePath
        );
    }
}
