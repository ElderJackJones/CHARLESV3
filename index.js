import chalk from "chalk";
import prompts from "prompts";
import { configCharles } from "./configCharles.js";
import { sneakyChurch } from "./connectToChurch/sneakyChurch.js";
import { prettyStringZones } from "./prettyStringZones.js";
import { createPayload } from "./createPayload.js";
import { existsSync, promises as fs, readFileSync } from "fs";
import { sneakyFacebook } from "./connectToFacebook/sneakyFacebook.js";
import { lastRun } from "./lastRun.js";

async function main() {
    console.clear()
    console.log(chalk.dim('Welcome to Charles, booting up...'))
    const config = await fs.readFile('./resources/config.json', 'utf8').then(JSON.parse);
    
    async function menu() {
        const questions = {
            type: 'select',
            name: 'program',
            message: 'What should we do today?',
            choices: [
                { title: 'Send Charles message', value: 'charles'},
                { title: 'Report uncontacted referrals', value: 'report'},
                {title: 'Change settings', value: 'settings'},
                { title: 'Yeet outta here', value: 'exit'}
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
                    await sneakyFacebook()
                }
            }
        } else if (select.program?.includes('report')) {
            function isLessThan12HoursOld(timestamp) {
                const twelveHoursInMs = 20 * 60 * 60 * 1000; // 12 hours in milliseconds
                const now = Date.now();
                return now - timestamp < twelveHoursInMs;
            }
            let zoneByZone
            // report
            // You can call the function that handles reporting here, or leave it empty to simulate reporting behavior\
            try {
                if (existsSync('payload.json')) {
                    let payload = await JSON.parse(readFileSync('payload.json'))
                    if (isLessThan12HoursOld(payload.stamp)) {
                        zoneByZone = prettyStringZones(payload, payload.average)
                    }
                } else {
                    throw new Error('No File! Refetching data.')
                }
            // eslint-disable-next-line no-unused-vars
            } catch (e) {
                const [list, avgMsg] = await sneakyChurch(config.username, config.password)
                const data = await createPayload(list, avgMsg)
                zoneByZone = prettyStringZones(data, avgMsg)
            }
            console.log(zoneByZone)
            console.log("\n")
        } else if (select.program?.includes('exit')) {
            console.log("Exiting...");
            break;
        } else if (select.program?.includes('settings')) {
            try {
                await fs.unlink('./resources/charlesConfig.json')
                await configCharles('./resources/charlesConfig.json')
            // eslint-disable-next-line no-unused-vars
            } catch (err) {
                await configCharles('./resources/charlesConfig.json')
            }
            
        }
    } while (!select.program?.includes('exit'));
}

main();
