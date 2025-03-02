import { promises } from 'fs'
import fetch from 'node-fetch'

// returns a random LOTR quote
// Store a bearer from https://the-one-api.dev/documentation#3 in a file named lotrBearer.txt
// That's really all there is to it.
// Maybe I should make it store scriptures...

const rollTheDice = (list) => {
    return list[Math.floor(Math.random() * list.length)]
}

const randLOTR = async () => {
    const bearer = await promises.readFile('lotrBearer.txt')

    const response = await fetch('https://the-one-api.dev/v2/quote', {
        headers: {
            Authorization: `Bearer ${bearer}`
        }
    })
    const quotes = await response.json()


    const quoth = rollTheDice(quotes.docs)
    let quote = quoth.dialog

    const character = await fetch(`https://the-one-api.dev/v2/character/${quoth.character}`, {
        headers: {
            Authorization: `Bearer ${bearer}`
        }
    })

    const characterInfo = await character.json()
    return quote += `\n--${characterInfo.docs[0].name}`
}

console.log(await randLOTR())