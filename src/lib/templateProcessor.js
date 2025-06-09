import fs from 'fs';

export function processTemplate(templatePath, vars) {
    let content = fs.readFileSync(templatePath, 'utf-8');
    content = content.replace(/\{\%\s*Quiz Name\s*\%\}/g, vars.quizName);
    content = content.replace(/\{\%\s*Final\/Midterm Sheet\s*\%\}/g, vars.quizFor);
    content = content.replace(/\{\%\s*N\s*\%\}/g, String(vars.questionsCount));
    content = content.replace(/\{\%\s*T\s*\%\}/g, String(vars.duration));
    content = content.replace(/\{\%\s*JSON Path\s*\%\}/g, vars.jsonPath);
    return content;
}
