import { readFileSync } from "fs";

export async function randomMessage() {
    const options = await JSON.parse(readFileSync('./connectToFacebook/kindMessages.json')).messages
    const randomIndex = Math.floor(Math.random() * options.length)

    return options[randomIndex]
}