import puppeteer from "puppeteer"
import path from 'node:path'
import { cookieHandler, saveCookies } from "./cookieHandler.js"
import { readFileSync, writeFileSync } from "fs"
import { jwtDecode } from "jwt-decode"
import { getAverage } from "./getAverage.js"
import { superParse } from "./superParse.js"
import { listToday } from "./listToday.js"
import ora from "ora"
import { getBearer } from "./getBearer.js"

function isMoreThanADayOld(timestamp) {
    const oneDay = 24 * 60 * 60 * 1000
    const now = Date.now()
    return now - timestamp > oneDay
}

export async function login(user, pass, page) {
    // Enter username
    await page.goto('https://referralmanager.churchofjesuschrist.org/')
    await page.waitForSelector("input[name='identifier']", { timeout: 10000 });
    const username = await page.$("input[name='identifier']")
    await username.type(user)
    await page.click("input[type='submit']")

    // Enter password
    await page.waitForSelector("input[name='credentials.passcode']", {timeout: 10000})
    await page.type("input[name='credentials.passcode']", pass)
    await page.click("input[type='submit']")
    await page.waitForNavigation()
    // get cookies and save
    const cookies = await page.cookies()
    await saveCookies(cookies)

}

// False == should not pull
async function toPullOrNotToPullThatIsTheQuestion(pathToHome) {
    try {
        let thiccList = readFileSync(path.join(pathToHome, 'resources', 'people.json'), 'utf-8')
        let thiccJSON = await JSON.parse(thiccList)
        let rawList = readFileSync(path.join(pathToHome, 'resources', 'rawList.json'), 'utf-8')
        let rawJSON = await JSON.parse(rawList)
        if (!isMoreThanADayOld(thiccJSON.processedTime) && !isMoreThanADayOld(rawJSON.processedTime)) {
            return false
        }
        else {
            return true
        }
     
    } catch (e) {
        console.log(e)
        return true
    }
}

export async function getPeopleList(page, bearer, decodedBearer) {
    const list = await page.evaluate(async (decodedBearer, bearer) => {
        const peopleList = await fetch(`https://referralmanager.churchofjesuschrist.org/services/people/mission/${JSON.stringify(decodedBearer.missionId)}?includeDroppedPersons=true`, {
            method: 'GET',
            headers: {
                'Authorization' : `Bearer ${bearer}`
            }
        })
        const list = await peopleList.json()
        return list
    }, decodedBearer, bearer)
    return list
}

export async function sneakyChurch(user, pass, pathToHome="", headless=true) {
    console.clear()
    let spool = ora('Opening browser').start()
    // Launch browser and use cookies from previous session if possible.
    const browser = await puppeteer.launch({ headless:headless })
    const page = await browser.newPage()
    spool.color = 'magenta'
    spool.text = "Doin' some black magic"
    const okayToSkipLogin = await cookieHandler(page, pathToHome)
    if (okayToSkipLogin) {
        await page.goto('https://referralmanager.churchofjesuschrist.org/')
        const isLoggedOut = await page.$("input[name='identifier']")
        if (isLoggedOut) {
            await login(user, pass, page)
        }
    } else {
        await login(user, pass, page)
    }
    spool.color = 'green'
    spool.text = 'Stealing your identity'
    // Snag the bearer token *enters hacker mode*
    const bearer = await getBearer(page)
    const decodedBearer = jwtDecode(bearer)
    let lossyList
    let todaysList
    let beginPackage

    // Get new list if we don't have one cached
    if (await toPullOrNotToPullThatIsTheQuestion(pathToHome)) {
        spool.color = 'cyan'
        spool.text = 'Fetching referrals'
        const fullListObj = await getPeopleList(page, bearer, decodedBearer)

        writeFileSync(path.join(pathToHome, 'resources', 'rawList.json'), JSON.stringify(fullListObj))
        spool.info('Getting Average contact times!')

        beginPackage = await getAverage(fullListObj.persons, page)

        lossyList = await superParse(fullListObj)
        todaysList = await listToday(lossyList)
        writeFileSync(path.join(pathToHome, 'resources', 'people.json'), JSON.stringify(
            { 'processedTime' : Date.now(),
            'persons' : todaysList
            }
        ))
        spool.succeed('Referrals retrieved')
        await browser.close()
        return [todaysList, beginPackage]
    } else {
        lossyList = await JSON.parse(readFileSync(path.join(pathToHome, 'resources', 'people.json')))
        let rawList = await JSON.parse(readFileSync(path.join(pathToHome, 'resources', 'rawList.json')))
        spool.info('Snooping out Average contact times!')

        beginPackage = await getAverage(rawList.persons, page)
        todaysList = await listToday(lossyList.persons)
        spool.succeed('Referrals retrieved')
        await browser.close()
        return [todaysList, beginPackage]
    }

}

