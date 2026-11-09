import { ROUTES, closestRoute } from "../../utils/distanceRoutes";
import { routeLine } from "../../utils/wrapped";

describe("closestRoute", () => {
    test("routes are sorted by distance", () => {
        const kms = ROUTES.map((r) => r.km);
        expect(kms).toEqual([...kms].sort((a, b) => a - b));
    });

    test("picks the nearest route", () => {
        expect(closestRoute(300000)).toMatchObject({ from: "New York", to: "Boston", farther: false });
        expect(closestRoute(663000)).toMatchObject({ from: "Sydney", to: "Melbourne" });
    });

    test("returns null for distances shorter than every route", () => {
        expect(closestRoute(5000)).toBeNull();
    });

    test("flags distances well past the longest route", () => {
        expect(closestRoute(6000000)).toMatchObject({ from: "New York", to: "Los Angeles", farther: true });
    });
});

describe("routeLine", () => {
    test("describes the closest route", () => {
        expect(routeLine(130000, "mile")).toBe("combined, that's about the distance from New York to Philadelphia as the crow flies 🗺️");
    });
    test("says farther than for huge totals", () => {
        expect(routeLine(6000000, "mile")).toMatch("farther than the distance from New York to Los Angeles");
    });
    test("falls back for tiny totals", () => {
        expect(routeLine(5000, "kilometer")).toBe("every kilometer counts 💙");
    });
});
