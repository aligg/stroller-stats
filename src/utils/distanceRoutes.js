// Straight-line ("as the crow flies") distances between city centers, computed with the
// haversine formula from each city's coordinates. Driving distances are longer and vary by
// route, so the copy says "as the crow flies". Keep sorted by km.
export const ROUTES = [
    { from: "San Francisco", to: "Oakland", km: 13 },
    { from: "Seattle", to: "Tacoma", km: 40 },
    { from: "Amsterdam", to: "Rotterdam", km: 57 },
    { from: "Boston", to: "Providence", km: 66 },
    { from: "London", to: "Brighton", km: 76 },
    { from: "New York", to: "Philadelphia", km: 130 },
    { from: "Chicago", to: "Milwaukee", km: 131 },
    { from: "Los Angeles", to: "San Diego", km: 179 },
    { from: "Seattle", to: "Vancouver", km: 195 },
    { from: "Seattle", to: "Portland", km: 234 },
    { from: "Paris", to: "Brussels", km: 264 },
    { from: "Austin", to: "Dallas", km: 293 },
    { from: "New York", to: "Boston", km: 306 },
    { from: "London", to: "Paris", km: 344 },
    { from: "Dallas", to: "Houston", km: 362 },
    { from: "Toronto", to: "Montreal", km: 504 },
    { from: "San Francisco", to: "Los Angeles", km: 559 },
    { from: "Sydney", to: "Melbourne", km: 713 },
    { from: "Paris", to: "Berlin", km: 877 },
    { from: "New York", to: "Chicago", km: 1144 },
    { from: "London", to: "Rome", km: 1434 },
    { from: "Chicago", to: "Denver", km: 1478 },
    { from: "New York", to: "Miami", km: 1758 },
    { from: "New York", to: "Houston", km: 2281 },
    { from: "Chicago", to: "Los Angeles", km: 2804 },
    { from: "New York", to: "Los Angeles", km: 3936 },
];

// Beyond this ratio of the closest route, "about" stops being honest.
const MAX_RATIO = 1.25;

/**
 * Picks the route closest to the given distance (compared on a log scale, so 20% over and
 * 20% under count the same). Returns null when the distance is shorter than every route.
 * `farther` is true when the distance is well past the longest route.
 */
export const closestRoute = (meters) => {
    const km = meters / 1000;
    if (km < ROUTES[0].km / MAX_RATIO) {
        return null;
    }
    const longest = ROUTES[ROUTES.length - 1];
    if (km > longest.km * MAX_RATIO) {
        return { ...longest, farther: true };
    }
    const distanceTo = (route) => Math.abs(Math.log(km / route.km));
    const best = ROUTES.reduce((a, b) => (distanceTo(b) < distanceTo(a) ? b : a));
    return { ...best, farther: false };
};
