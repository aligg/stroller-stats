import { getMiles } from "./getMiles";
// Helper function to get the month value from the "year-month" string
const getMonthValue = (monthString) => {
    const [year, month] = monthString.split("-");
    return parseInt(year) * 12 + parseInt(month);
}
    
export const formatMonthData = (data) => {
    // Extracting months and distances separately
    const months = [];
    const runDistances = [];
    const walkDistances = [];

    // Looping through the data array
    for (let i = 0; i < data.length; i++) {
        const current = data[i];
        const currentMonth = current.month;
        const currentRunDistance = getMiles(current.run_distance);
        const currentWalkDistance = getMiles(current.walk_distance);

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