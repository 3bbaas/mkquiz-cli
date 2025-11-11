#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import configCommand from './commands/config';
import addCommand from './commands/add';
import rmvCommand from './commands/rmv';
import log from './utils/logger';


async function intro() {
    console.log(
        '\n\n' +
            chalk.cyanBright(
                figlet.textSync('mkquiz', {
                    font: 'DOS Rebel',
                    horizontalLayout: 'default',
                    verticalLayout: 'default',
                })
            ) +
            chalk.cyan('\n\n\tCLI to add quizzes to a Quizzez static project\n')
    );
}

// Main program configuration
program
    .name('mkquiz')
    .version('2.1.0')
    .description('CLI tool to manage quizzes in a static Quizzez project')
    .action(intro);

// Config command
program
    .command('config')
    .description('Set up Quizzez project configuration')
    .action(configCommand);

// Add command
program
    .command('add')
    .description('Add a new quiz to the project')
    .action(addCommand);

// Remove command
program
    .command('remove')
    .alias('rmv')
    .description('Remove an existing quiz from the project')
    .action(rmvCommand);

// Revive command (rebuild all quizzes) - TODO: Implement
// program
//     .command('revive')
//     .description('Rebuild all quizzes in the project')
//     .action(rebuildCommand);

// Fix paths command - TODO: Implement
// program
//     .command('fix-paths')
//     .description('Fix paths in the JSON file to use forward slashes and ensure leading slash')
//     .action(fixPathsCommand);

// Completion command for shell autocompletion
program
    .command('completion')
    .description('Generate shell completion script')
    .action(() => {
        const shell = process.env.SHELL || 'bash';
        
        if (shell.includes('bash')) {
            console.log(generateBashCompletion());
        } else if (shell.includes('zsh')) {
            console.log(generateZshCompletion());
        } else if (shell.includes('powershell') || shell.includes('pwsh')) {
            console.log(generatePowerShellCompletion());
        } else {
            console.log('Unsupported shell. Please use bash, zsh, or PowerShell.');
            log.warn('Unsupported shell for completion', { shell });
        }
    });

// Error handling
program.exitOverride((err) => {
    if (err.code === 'commander.help' || err.code === 'commander.helpDisplayed') {
        process.exit(0);
    }
    log.error('Command error', err);
    process.exit(1);
});

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
    intro().then(() => {
        program.outputHelp();
    });
}

/**
 * Generate bash completion script
 */
function generateBashCompletion(): string {
    return `
# mkquiz bash completion script
_mkquiz_completions() {
    local cur prev commands
    cur="\${COMP_WORDS[COMP_CWORD]}"
    prev="\${COMP_WORDS[COMP_CWORD-1]}"
    commands="config add remove rmv revive fix-paths completion help --version --help"
    
    if [ $COMP_CWORD -eq 1 ]; then
        COMPREPLY=( $(compgen -W "$commands" -- "$cur") )
    fi
}

complete -F _mkquiz_completions mkquiz

echo "# Add this to your ~/.bashrc:"
echo "source <(mkquiz completion)"
`;
}

/**
 * Generate zsh completion script
 */
function generateZshCompletion(): string {
    return `
# mkquiz zsh completion script
#compdef mkquiz

_mkquiz() {
    local -a commands
    commands=(
        'config:Set up Quizzez project configuration'
        'add:Add a new quiz to the project'
        'remove:Remove an existing quiz from the project'
        'rmv:Remove an existing quiz from the project (alias)'
        'revive:Rebuild all quizzes in the project'
        'fix-paths:Fix paths in the JSON file'
        'completion:Generate shell completion script'
        'help:Display help information'
    )
    
    _describe 'command' commands
}

_mkquiz

echo "# Add this to your ~/.zshrc:"
echo "eval \\"$(mkquiz completion)\\""
`;
}

/**
 * Generate PowerShell completion script
 */
function generatePowerShellCompletion(): string {
    return `
# mkquiz PowerShell completion script
Register-ArgumentCompleter -Native -CommandName mkquiz -ScriptBlock {
    param($wordToComplete, $commandAst, $cursorPosition)
    
    $commands = @(
        'config',
        'add',
        'remove',
        'rmv',
        'revive',
        'fix-paths',
        'completion',
        'help',
        '--version',
        '--help'
    )
    
    $commands | Where-Object { $_ -like "$wordToComplete*" } | ForEach-Object {
        [System.Management.Automation.CompletionResult]::new($_, $_, 'ParameterValue', $_)
    }
}

Write-Host "# Add this to your PowerShell profile:"
Write-Host "mkquiz completion | Invoke-Expression"
`;
}
