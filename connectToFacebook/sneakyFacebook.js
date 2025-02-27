import { existsSync, promises } from "fs"
import puppeteer from "puppeteer-extra"
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { getZone } from "../getZone.js"
import { prettyString } from "./prettyString.js"
import { editPayload } from "./editPayload.js"
import ora from "ora"

puppeteer.use(StealthPlugin())


const wiggy = async (page) => {
    const viewport = await page.viewport()|| { width: 1280, height: 800 }
    const maxX = await viewport.width
    const maxY = await viewport.height
    const x = Math.floor(Math.random() * maxX);
    const y = Math.floor(Math.random() * maxY);

    // Move the mouse with a smooth transition
    await page.mouse.move(x, y, { steps: 10 });
}


// // More humanlike typing
// const humanType = async (page, element, message, bar) => {
//     for (const char of message) {
//         // Simulate occasional hesitations
//         if (Math.random() < 0.05) { // 5% chance
//             await sleep(Math.floor(Math.random() * 500) + 200);
//         }
//         // Simulate a typing error occasionally
//         if (Math.random() < 0.03) { // 3% chance
//             const mistake = 'x'; // a random wrong character, could be improved
//             await element.type(mistake, { delay: 150 });
//             await sleep(Math.floor(Math.random() * 100) + 50);
//             await page.keyboard.press('Backspace');
//         }
//         // Type the intended character
//         if (char === "\n") {
//             await page.keyboard.down('Shift');
//             await page.keyboard.press('Enter');
//             await page.keyboard.up('Shift');
//         } else {
//             await element.type(char, { delay: Math.floor(Math.random() * 150) + 50 });
//         }
//         bar.increment()
//     }
// };



const waitForE2ee = async (e2ee, page) =>  {
    let pinBox = null
    try {
        pinBox = await page.waitForSelector('input[id="mw-numeric-code-input-prevent-composer-focus-steal"]', {
            timeout: 5000
        })
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
        await sleep(500)
    }
    if (pinBox) {
        await pinBox.type(e2ee, { delay: 250 })
    }

}

const goToChat = async (allTheChats, page, id) => {
    let chatFound = false

    for (const chat of allTheChats) {
        if (chat.id === id.toString()) {
            chatFound = true
            await page.evaluate( async (href) => {
                const element = document.querySelector(`a[href="${href}"]`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    await element.click()
                } 
                
            }, chat.href);
        }
    }
    if (!chatFound) {
        await page.goto(`https://www.messenger.com/t/${id}`)
        await page.waitForNetworkIdle()
    }
    }


const login = async (page, mail, pass) => {
    // logs into facebook messenger
    await page.goto('https://messenger.com/', { waitUntil: 'networkidle2'})

    // Get elements
    const mailBox = await page.waitForSelector('input[id="email"]')
    const passBox = await page.waitForSelector('input[id="pass"]')
    const button = await page.waitForSelector('button[id="loginbutton"]')

    // Send in data
    await mailBox.type(mail, { delay: 250 })
    await passBox.type(pass, { delay: 375 })
    await button.click()
    await page.waitForNavigation()
}

const saveCookies = async (browser) => {
    // Goes and smuggles cookies
    const cookies = await browser.cookies()
    await promises.writeFile('resources/messenger.json', JSON.stringify(cookies, null, 4))
}

const loadCookies = async (browser, page) => {
    await page.goto('https://messenger.com/')
    let cookies
    try {
        cookies = await JSON.parse( await promises.readFile('resources/messenger.json'))
    // eslint-disable-next-line no-unused-vars
    } catch(e) {
        return
    }

    for (const cookie of cookies) {
        browser.setCookie(cookie)
    }

    await page.reload()
}

const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export const sneakyFacebook = async () => {
    let spool = ora('Booting up Charles').start()
    // Set up environment (is that how it's spelt?)
    const browser = await puppeteer.launch({
        headless: false,  // toggle if you want to see the browser
        args: [
        '--disable-infobars',
        '--start-maximized',
        '--disable-extensions',
        '--window-size=1920,1080',
        '--disable-gpu',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36'
      ],
    })
    const page = await browser.newPage()
    // FB user and password
    spool.text = 'Sequestering your identification'
    spool.color = 'blue'
    const userObj = await JSON.parse( await promises.readFile('resources/config.json'))
    const username = userObj.botname
    const password = userObj.botpassword


    // Try to snag cookies and skip login
    await loadCookies(browser, page)
    const mailBox = await page.waitForSelector('input[id="email"]', { timeout: 5000 }).catch(() => null);
    if (mailBox) {
        await login(page, username, password)
        await saveCookies(browser)
    }
    spool.text = "I'm totally a human, Facebook, TRUST ME!"
    spool.color = 'red'


  

    await waitForE2ee('123456', page)


      
    
    // Go through each chat and zone and do cool stuff
    let zones 
    if (existsSync('resources/charlesConfig.json')) {
        zones = await promises.readFile('resources/charlesConfig.json')
        .then(JSON.parse)
    } else {
        zones = await getZone()
    }

    let reformattedPayload = await editPayload()

    setInterval(() => wiggy(page), 5000);
    spool.succeed(' Everything is spick and span')
    // Go through list of zones and send a message to each

    for (const zone in zones) {
        let waitingSpool = ora(`Storming the castle`).start()

        const allTheChats = await page.$$eval(
            'a[class="x1i10hfl x1qjc9v5 xjbqb8w xjqpnuy xa49m3k xqeqjp1 x2hbi6w x13fuv20 xu3j5b3 x1q0q8m5 x26u7qi x972fbf xcfux6l x1qhh985 xm0m39n x9f619 x1ypdohk xdl72j9 x2lah0s xe8uvvx x2lwn1j xeuugli xexx8yu x4uap5 x18d9i69 xkhd6sd x1n2onr6 x16tdsg8 x1hl2dhg xggy1nq x1ja2u2z x1t137rt x1q0g3np x87ps6o x1lku1pv x1a2a7pz x1lq5wgf xgqcy7u x30kzoy x9jhf4c xdj266r x11i5rnm xat24cr x1mh8g0r x78zum5"]',
            (elements) => {
              return elements.map((item) => {
                const href = item.getAttribute('href');
                return {
                  id: href.match(/(\d+)\/?$/)?.[1],
                  href: href
                };
              });
            }
          );
        
        waitingSpool.text = `Sending a message to ${zone}`
        waitingSpool.color = 'magenta'

        const message = await prettyString(zone, reformattedPayload[zone], reformattedPayload["avg"])
        // bar.start(message.length, 0)

        // So originally the problem was not 
        // appearing to be human, that's why we have 
        // humantype and other things like that. 
        // We've discovered that you can just
        // copy and paste and that's human
        // enough. If you try to change this, remember 
        // that you have to be human! :)

        await goToChat(allTheChats, page, zones[zone])
        await sleep(5000)
        await page.evaluate((message) => {
            navigator.clipboard.writeText(message);
          }, message)
        await page.focus('div[role="textbox"]')
        // await humanType(page, boxy, message, bar)
        await sleep(Math.floor(Math.random() * 500) + 1)
        await page.keyboard.down('Control');
        await page.keyboard.press('KeyV');
        await page.keyboard.up('Control');
        await sleep(Math.floor(Math.random() * 500) + 1)
        const button = await page.waitForSelector('div[aria-label="Press enter to send"]')
        await button.click()
        await sleep(5000)
        waitingSpool.succeed(`Message sent to ${zone}`)
    }
    
    await browser.close()
} 
