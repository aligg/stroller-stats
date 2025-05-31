import { getDistance } from "./getDistance";


// helper sort function
const sortData = (a, b) => {
    // Extract the year and month from the strings
    let [yearA, monthA] = a.month.split("-");
    let [yearB, monthB] = b.month.split("-");

    // Convert the strings to numbers for comparison
    yearA = parseInt(yearA);
    monthA = parseInt(monthA);
    yearB = parseInt(yearB);
    monthB = parseInt(monthB);

    // Compare the years
    if (yearA !== yearB) {
        return yearA - yearB;
    } else {
        // If the years are the same, compare the months
        return monthA - monthB;
    }
}
// Helper function to get the month value from the "year-month" string
const getMonthValue = (monthString) => {
    const [year, month] = monthString.split("-");
    return parseInt(year) * 12 + parseInt(month);
}
    
export const formatMonthData = (data, optedInToKilometers = false) => {
    data.sort(sortData)
    // Extracting months and distances separately
    const months = [];
    const runDistances = [];
    const walkDistances = [];

    // Looping through the data array
    for (let i = 0; i < data.length; i++) {
        const current = data[i];
        const currentMonth = current.month;
        const currentRunDistance = getDistance(current.run_distance, optedInToKilometers);
        const currentWalkDistance = getDistance(current.walk_distance, optedInToKilometers);

        months.push(currentMonth);
        runDistances.push(currentRunDistance);
        walkDistances.push(currentWalkDistance);

        if (i < data.length - 1) {
            const nextMonth = data[i + 1].month;

            // Filling in missing months
            const currentMonthValue = getMonthValue(currentMonth);
            const nextMonthValue = getMonthValue(nextMonth);

            for (let j = currentMonthValue + 1; j < nextMonthValue; j++) {
                const year = Math.floor(j / 12);
                const month = j % 12;
                months.push(`${year}-${month}`);
                runDistances.push(0);
                walkDistances.push(0);
            }
        }
    }
    return [months, runDistances, walkDistances]
}