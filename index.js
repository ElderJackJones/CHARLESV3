#!/usr/bin/env node

import chalk from "chalk";
import prompts from "prompts";
import { configCharles } from "./configCharles.js";
import { sneakyChurch } from "./connectToChurch/sneakyChurch.js";
import { createPayload } from "./createPayload.js";
import { promises as fs, existsSync, mkdirSync } from "fs";
import { sneakyFacebook } from "./connectToFacebook/sneakyFacebook.js";
import { lastRun } from "./lastRun.js";
import { smlReport } from "./smlReport.js";
import { createConfig } from "./createConfig.js";

async function main() {
    if (!existsSync('./resources')) {
        mkdirSync('./resources')
    }
    console.clear()
    console.log(chalk.dim('Welcome to Charles, booting up...'))
    let config
    try {
        config = await fs.readFile('./resources/config.json', 'utf8').then(JSON.parse);
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
        console.log(chalk.redBright("Looks like you haven't used Charles before! Let's set this up...\n"))
        config = await createConfig("resources/config.json")
    }
    
    async function menu() {
        const questions = {
            type: 'select',
            name: 'program',
            message: 'What should we do today?',
            choices: [
                { title: 'Send Charles message', value: 'charles'},
                { title: 'Get SML report', value: 'report'},
                { title: 'Test run Charles', value: 'test'},
                { title: 'Change settings', value: 'settings'},
                { title: 'Yeet outta here', value: 'exit'},
            ],
            initial: 0,
            instructions: false
        }
        return await prompts(questions)
    }

    let select;
    do {
        select = await menu();
        if (!select.program) {
            console.log(chalk.red(chalk.italic("No option selected. Please try again.")));
            continue;
        }
        if (select.program?.includes('charles')) {
            // run charles
           // Only run if it has been less than 24 hours...
            const lessThan24HoursAgo = await lastRun()
            const e2ee = await prompts({
                type: 'text',
                name: 'e2ee',
                message: 'What is your e2ee pin?'
            })
            if (lessThan24HoursAgo) {
                const moveOn = await prompts(
                    {
                        type: 'confirm',
                        name: 'value',
                        message: "Woah there, do you still wanna run Charles? It's been less than two days since he last ran.",
                        initial: true
                      }
                )
                if (moveOn.value) {
                    console.clear()
                    const [todaysList, beginPackage] = await sneakyChurch(config.username, config.password)
                    await createPayload(todaysList, beginPackage)
                    await sneakyFacebook(undefined, undefined, e2ee.e2ee)
                }
            } else {
                console.clear()
                    const [todaysList, beginPackage] = await sneakyChurch(config.username, config.password)
                    await createPayload(todaysList, beginPackage)
                    await sneakyFacebook(undefined, undefined, e2ee)
            }
        } else if (select.program?.includes('report')) {
                try {
                    const report = await smlReport()
                    console.log(report)
                // eslint-disable-next-line no-unused-vars
                } catch (e) {
                    console.log(chalk.redBright("Your cookies must've gone stale :( Try test running Charles."))
                }
        } else if (select.program?.includes('exit')) {
            console.log("Exiting...");
            break
        } else if (select.program?.includes('settings')) {
            try {
                await fs.unlink('./resources/charlesConfig.json')
                await configCharles('./resources/charlesConfig.json')
            // eslint-disable-next-line no-unused-vars
            } catch (err) {
                await configCharles('./resources/charlesConfig.json')
            }
        }
        else if (select.program?.includes('test')) {
            console.clear()
            const security = await prompts([{
                type: 'text',
                name: 'testZone',
                message: 'What is the Messenger ID of your test chat?'
            }, {
                type: 'text',
                name: 'e2ee',
                message: 'What is your e2ee pin?'
            }])
            console.clear()
            const [todaysList, beginPackage] = await sneakyChurch(config.username, config.password, "", false)
            await createPayload(todaysList, beginPackage)
            await sneakyFacebook(security.testZone, false, security.e2ee)
        }
    } while (!select.program?.includes('exit'));
}

main();
