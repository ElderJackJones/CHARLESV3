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
            zoneObj = JSON.parse(readFileSync('resources/charlesConfig.json', 'utf8'));
        } catch (err) {
            console.error(err);
            return;
        }
    } else {
        zoneObj = await getZone();
    }

    const prettyList = {};
    prettyList["avg"] = payload.average

    for (const zone in zoneObj) {
        const areaMap = {};  // Will hold areaName as key, and people array as value
        
        for (const person of payload.payload[zone]) {
            if (zone.toLowerCase() === person.zoneName.toLowerCase()) {
                const areaName = person.areaName;
                // Initialize an array for the area if it doesn't exist yet
                if (!areaMap[areaName]) {
                    areaMap[areaName] = { people: [] };
                }
                // Add the person's name to the appropriate area
                areaMap[areaName].people.push("· " + person.name);  // Assuming 'name' is the key for person names
            }
        }
        
        prettyList[zone.toString()] = areaMap;

    }
    return prettyList
}
