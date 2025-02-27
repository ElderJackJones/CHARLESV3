import chalk from "chalk"
import { existsSync, readFileSync, writeFileSync } from "fs"
import prompts from "prompts"
import { getZone } from './getZone.js'
import { createConfig } from "./createConfig.js"


function checkConfig(configPath) {
    try {
        if (!existsSync(configPath)) {
            throw new Error("Config file not found.");
        }
        return JSON.parse(readFileSync(configPath));
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
        return null;
    }
}

export async function configCharles(configPath) {
     if (!existsSync(configPath.replace('/charlesConfig.json', '/config.json'))) {
        await createConfig('./resources/config.json')
     }
    if (checkConfig(configPath)) {
        return await JSON.parse(readFileSync(configPath))
    } else {
        console.clear()
        console.log(chalk.dim("You don't seem to have set up Charles yet, let's do that now!\n"))
        console.log(chalk.cyanBright("You're going to be asked for the Zone Chat ID of your groups.\nYou can find them in the Messenger Website ") + chalk.dim("(EX https://www.messenger.com/t/") + chalk.cyanBright("2276304299063254") + chalk.dim("<-- ID)"))
        const zoneArray = await getZone()
        let questions = []
        for (let i = 0; i < zoneArray.length; i++) {
            questions.push({
                type: 'text',
                name: zoneArray[i],
                message: `What is the Zone Chat ID for ${zoneArray[i]}?`
            });
        }
        const charlesConfig = await prompts(questions)
        writeFileSync('resources/charlesConfig.json', JSON.stringify(charlesConfig))
        return charlesConfig
    }
}
