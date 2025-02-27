export function prettyStringZones(data, avg) {
    let result = '';
    result += avg
    result += "\n"
    // Loop through each zone in the data
    for (const zone in data.payload) {
      if (data.payload.hasOwnProperty(zone)) {
        result += `${zone}\n`; // Add the zone name
        // For each member under the zone, list their name
        data.payload[zone].forEach(person => {
          result += `  - ${person.name}\n`; // Add the person's name
        });
        result += '\n'; // Add an empty line between zones
      }
    }
    
    return result;
  }