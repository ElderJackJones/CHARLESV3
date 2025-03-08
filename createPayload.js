import { existsSync, readFileSync, writeFileSync } from "fs";
import { configCharles } from './configCharles.js';

function isMoreThan12HoursOld(timestamp) {
    const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
    return (Date.now() - timestamp) > TWELVE_HOURS_MS;
}

export async function createPayload(list, avgMessage) {
    const FILE_NAME = 'payload.json';

    if (existsSync(FILE_NAME)) {
        try {
            const oldpay = JSON.parse(readFileSync(FILE_NAME, 'utf-8'));
            if (!isMoreThan12HoursOld(oldpay.stamp)) {
                return oldpay;
            }
        } catch (error) {
            console.error(`Error reading ${FILE_NAME}:`, error);
        }
    }

    let zoneList;
    try {
        zoneList = await configCharles('./resources/charlesConfig.json')
    } catch (error) {
        console.error("Error fetching zone data:", error);
        return null; // Return `null` or throw an error if needed
    }

    delete zoneList?.Dorthan
    let payload = { stamp: Date.now(), average: avgMessage, payload: {} }
    const zones = Object.keys(zoneList);

    // If list.persons exists and is an object, use its values; 
    // if it's already an array, use it directly.
    let cleaned = list

    
    for (let zone of zones) {
        payload.payload[zone] = cleaned.filter(person => 
            person.zoneName?.trim().toLowerCase() === zone.toLowerCase()
        )
    }

        try {
            writeFileSync(FILE_NAME, JSON.stringify(payload, null, 2))
        } catch (error) {
            console.error(`Error writing ${FILE_NAME}:`, error)
        }
    
        return payload;
    }

