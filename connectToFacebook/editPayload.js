import { existsSync, readFileSync } from "fs";
import { getZone } from "../getZone.js";

export async function editPayload() {
    let payload;
    
    try {
        payload = JSON.parse(readFileSync('payload.json', 'utf8'));
    } catch (err) {
        console.error(err);
        return;
    }

    let zoneObj;
    
    if (existsSync('resources/charlesConfig.json')) {
        try {
            zoneObj = await JSON.parse(readFileSync('resources/charlesConfig.json', 'utf8'));
        } catch (err) {
            console.error(err);
            return;
        }
    } else {
        zoneObj = await getZone();
    }

    const prettyList = {};
    prettyList["avg"] = payload.average

    for (const zone in payload.payload) {
        console.log(zone)
    }

    for (const zone in zoneObj) {
        const zoneClean = zone.trim().toString()
        const areaMap = {};  // Will hold areaName as key, and people array as value
        if (!payload.payload[zoneClean]) {
            console.log(zoneClean)
            continue
        }        
        for (const person of payload.payload[zoneClean]) {
            if (zone.toLowerCase().trim() === person.zoneName.toLowerCase().trim()) {
                const areaName = person.areaName;
                // Initialize an array for the area if it doesn't exist yet
                if (!areaMap[areaName]) {
                    areaMap[areaName] = { people: [] };
                }
                // Add the person's name to the appropriate area
                areaMap[areaName].people.push("· " + person.name);  // Assuming 'name' is the key for person names
            }
        }
        
        prettyList[zoneClean.toString()] = areaMap;

    }
    return prettyList
}
