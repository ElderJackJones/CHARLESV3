// Returns true if you should move on, false if it has been less than two days

import { promises } from "fs";

export async function lastRun() {
    let timeStampFile
    try {
        timeStampFile = (await promises.readFile('resources/lastRun.txt')).toString()
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
        timeStampFile = null
    }
    if (timeStampFile) {
        if ((Date.now() - (2 * 24 * 60 * 60 * 1000)) <= parseInt(timeStampFile)) {
            return true
        } else {
            await promises.writeFile('resources/lastRun.txt', Date.now().toString())
            return false
        }
    } else {
        await promises.writeFile('resources/lastRun.txt', Date.now().toString())
        return false
    }
}