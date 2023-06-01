export const getPreviousMonth = () =>  {
  // Get the current date
  const currentDate = new Date();

  // Get the current month index (0-11)
  const currentMonthIndex = currentDate.getMonth();

  // Create an array of month names
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];

  // Calculate the index of the previous month
  let previousMonthIndex = currentMonthIndex - 1;
  if (previousMonthIndex < 0) {
    previousMonthIndex = 11; // Set to December (index 11)
  }

  // Return the long name of the previous month
  return monthNames[previousMonthIndex];
}