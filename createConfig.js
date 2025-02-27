import chalk from "chalk";
import { promises } from "fs";
import prompts from "prompts";


export async function createConfig(configPath) {

    const questions = [
        {
            type: "text",
            name: "username",
            message: "What is your churchofjesuschrist.org username?",
        },
        {
            type: "password",
            name: "password",
            message: "What is your password?",
        },
        {
            type: "text",
            name: "botname",
            message: "What email is your bot registered under?",
        },
        {
            type: "password",
            name: "botpassword",
            message: "What is the password for that Facebook account?",
        },
        {
            type: "toggle",
            name: "save",
            message: "Would you like to save this information for future logins (recommended)?",
            initial: true,
            active: "yes",
            inactive: "no",
        },
    ];
    console.log(chalk.dim("Setting up Charles"));
    const response = await prompts(questions);
    if (response.save) {
        await promises.writeFile(configPath, JSON.stringify(response));
        return response;
    } else {
        return response;
    }
}
