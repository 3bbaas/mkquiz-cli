#!/usr/bin/env node

import {program} from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import configCommand from './src/commands/config.js';
import addCommand from './src/commands/add.js';
import rmvCommand from './src/commands/rmv.js';
import rebuildCommand from './src/commands/rebuild.js';
import fixPathsCommand from './src/commands/fix-paths.js';


export default async function intro() {
    console.log('\n\n' +
        chalk.cyanBright(
            figlet.textSync('mkquiz', {
                font: 'DOS Rebel',
                horizontalLayout: 'default',
                verticalLayout: 'default'
            })
        ) +
        chalk.cyan('\n\n\tCLI to add quizzes to a Quizzez static project\n')
    );
}
program
    .version('1.0.3')
    .description('CLI to add quizzes to a Quizzez static project')
    .action(intro);

program
    .command('config')
    .description('Set Quizzez project configration')
    .action(configCommand);

program
    .command('add')
    .description('Add a new quiz')
    .action(addCommand);

program
    .command('remove')
    .alias('rmv')
    .description('Remove an already exist quiz')
    .action(rmvCommand);

program
    .command('revive')
    .description('rebuild full quizzez')
    .action(rebuildCommand)

program
    .command('fix-paths')
    .description('Fix paths in the JSON file to use forward slashes and ensure leading slash')
    .action(fixPathsCommand);

program.parse(process.argv);
