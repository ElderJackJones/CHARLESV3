function isRecent(person) {
    const now = Date.now(); // Get the current timestamp in milliseconds
    const twoWeeksAgo = now - (14 * 24 * 60 * 60 * 1000); // Subtract 2 weeks in milliseconds
    const twelveHoursAgo = now - (12 * 60 * 60 * 1000); // Subtract 12 hours in milliseconds
    
    // Check if referral date is between 12 hours ago and 2 weeks ago
    return person.referralAssignedDate > twoWeeksAgo && person.referralAssignedDate <= twelveHoursAgo;
}


export function averageFilter(thing) {
    return thing.reduce((acc, person) => {
        if (isRecent(person)) {
            acc.push({
                guid: person.personGuid,
                zoneName: person.zoneName,
                areaName: person.areaName
            });
        }
        return acc;
    }, []);
}
