function isWithinTimeRange(dateString) {
    const givenDate = new Date(dateString);
    const now = new Date();

    // Calculate the time boundaries
    const fortyEightHoursAgo = new Date(now);
    fortyEightHoursAgo.setHours(now.getHours() - 2);

    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(now.getDate() - 14);

    // Check if the given date is within the range
    return givenDate >= fourteenDaysAgo && givenDate <= fortyEightHoursAgo;
}

function isGreenOrYellow(obj) {
    if (obj.personStatus === 1 || obj.personStatus === 2 || obj.personStatus === 3 || obj.personStatus === 4) {
        return true
    } else {
        return false
    }
}

function unattempted(obj) {
    return (obj.referralStatus === 10)
}

 function unsuccessful(obj) {
    return (obj.referralStatus === 20)
}

export async function listToday(list) {
    console.log(list)
    let listFinal = []
    if (!Array.isArray(list) && typeof list === 'object') {
        for (const key in list) {
            if (isWithinTimeRange(list[key].assignedDate) && isGreenOrYellow(list[key]) && (unattempted(list[key]) || unsuccessful(list[key]))) {
                listFinal.push(list[key])
            }
        }
    } else {
        let todaysList = list.filter(obj => isWithinTimeRange(obj.assignedDate))
        const todaysListWithoutGrey = todaysList.filter(obj => isGreenOrYellow(obj))
        listFinal = todaysListWithoutGrey.filter(obj =>{
            return (unattempted(obj) || unsuccessful(obj))
        })
    }
    
    return listFinal
}