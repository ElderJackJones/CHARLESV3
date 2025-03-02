import chalk from "chalk"
import cliProgress from 'cli-progress'
import fetch from 'node-fetch'
import { promises } from "fs"
import { randLOTR } from './randLOTR.js'
import { averageFilter } from "./connectToChurch/averageFilter.js"

function formatTime(minutes) {
    const days = Math.floor(minutes / 1440); // 1 day = 1440 minutes
    const hours = Math.floor((minutes % 1440) / 60); // Remaining hours
    const mins = Math.floor(minutes % 60); // Remaining minutes

    let result = [];
    if (days > 0) result.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours > 0) result.push(`${hours} hr${hours > 1 ? 's' : ''}`);
    if (mins > 0 || result.length === 0) result.push(`${mins} min${mins > 1 ? 's' : ''}`);

    return result.join(" ");
}

async function processContactTime(timeline) {
    const reversedTimeline = [...timeline].reverse();

    let referralSent = null;
    let lastContact = null;

    for (const item of reversedTimeline) {
        switch (item.timelineItemType) {
            case "NEW_REFERRAL":
                referralSent = new Date(item.itemDate);
                lastContact = null; // Reset when a new referral is found
                break;
            case "CONTACT":
            case "TEACHING":
                if (!lastContact) {
                    lastContact = new Date(item.itemDate);
                }
                break;
            default:
                continue;
        }
    }

    if (referralSent && lastContact) {
        const duration = (lastContact - referralSent) / (1000 * 60); // Convert milliseconds to minutes
        return Math.floor(duration);
    }

    return null;
}


const getPersonTimeline = async (id, bearer, cookie) => {
    const personTimeline = await fetch(`https://referralmanager.churchofjesuschrist.org/services/progress/timeline/${id}`, {
        method: 'GET',
        'headers': {
            "Authorization": `Bearer ${bearer}`,
            "Cookie": cookie,
            "User-Agent": "Mozilla/5.0"
        }
    })
    .then(response => response.json())

    return await processContactTime(personTimeline)
}

export const smlReport = async () => {

    const randQuote = await randLOTR()

    const bar = new cliProgress.SingleBar({
        format: randQuote + "\n  " + chalk.magenta('{bar}') + '| {percentage}% || {value}/{total} People || ETA: {eta_formatted}',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true
    });


    let rawList
    try {
        rawList = await JSON.parse( await promises.readFile('resources/rawList.json'))
    // eslint-disable-next-line no-unused-vars
    } catch(e) {
        console.log(chalk.red("You shall not pass! Run Charles at least once before accessing SML features."))
        return
    }

    // Filter list down
    const filtered = await averageFilter(rawList.persons)
    const bearer = (await promises.readFile('resources/bearer.txt')).toString().trim()
    const cookieDough = await JSON.parse(await promises.readFile('resources/cookies.json'))
    const cookieString = cookieDough
    .map(cookie => `${cookie.name}=${cookie.value}`)
    .join("; ");

    bar.start(filtered.length, 0)
    let contactsWithoutAveraging = {}


    // If you don't await these promises the church servers will block you so you don't DDoS them.
    for (const person of filtered) {
        if (!person.guid) {
            continue
        }
        const time = await getPersonTimeline(person.guid, bearer, cookieString)
        if (!contactsWithoutAveraging[person.areaName]) {
            contactsWithoutAveraging[person.areaName] = []
        } 
        contactsWithoutAveraging[person.areaName].push(time)
        bar.increment()
    }

    bar.stop()

    // DELETE anything empty that remains

    delete contactsWithoutAveraging[null];
    delete contactsWithoutAveraging[undefined];
    delete contactsWithoutAveraging[""];

    let areaAverages = Object.entries(contactsWithoutAveraging)
    .map(([area, times]) => ({ area: area.trim(), avgTime: times.reduce((sum, t) => sum + (t || 0), 0) / times.length })) // Compute numeric average
    .sort((a, b) => a.avgTime - b.avgTime); // Sort by shortest average contact time

    let message = "-->Contact Times<--\n\n"
    for (const { area, avgTime } of areaAverages) {
        let prefix = "⌛"
        if (avgTime < 360) {
            prefix = '🔥'
        } else if (avgTime > 720) {
            prefix = '😱'
        }
        message += `${prefix} ${area}: ${formatTime(avgTime)}\n`
    }

    return message
}  

console.log(await smlReport())