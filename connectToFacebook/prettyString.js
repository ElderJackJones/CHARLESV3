import { readFileSync } from "fs";
import { randomMessage } from "./randomMessage.js";

export async function prettyString(name, wholeShebang, avg) {
    let fancifulString = '';
    const kindMessage = await randomMessage();
    fancifulString += `${kindMessage}\n\n`;
    fancifulString += `${avg}\n-->Uncontacted Referrals<--\n\n`;
    fancifulString += `${name}\n`

    if (Object.keys(wholeShebang).length <= 0) {
        const options = await JSON.parse(readFileSync('connectToFacebook/crazyJob.json'))
        const randomIndex = Math.floor(Math.random() * options.length)
        fancifulString += options[randomIndex]
    }

    for (const [area, people] of Object.entries(wholeShebang)) {
        fancifulString += `\n⇒ ${area}\n`
        for (const person of people.people) {
            fancifulString += `    ${person}\n`
        }
    }

    return fancifulString; // Return the constructed string
}
