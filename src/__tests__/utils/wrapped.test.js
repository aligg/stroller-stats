import {
    buildSlides,
    cleanTitle,
    defaultWrappedYear,
    distanceComparison,
    rankLine,
    shareText,
} from "../../utils/wrapped";

const baseData = {
    year: 2026,
    first_name: "Ali",
    distance_unit: "mile",
    stroller: {
        total_distance: 160934.4, // 100 miles
        run_distance: 120700.8,
        walk_distance: 40233.6,
        activity_count: 30,
        run_count: 20,
        walk_count: 10,
        longest: { distance: 21097, sport_type: "Run", start_date: "2026-04-06T15:00:00Z", title: "Half! #strollerstats" },
        busiest_month: { month: 7, distance: 32186.88 },
    },
    pack: null,
    leaderboard: { opted_in: true, rank: 3, participants: 87 },
};

const keys = (slides) => slides.map((s) => s.key);

describe("defaultWrappedYear", () => {
    test("uses the current year outside January", () => {
        expect(defaultWrappedYear(new Date(2026, 11, 1))).toBe(2026);
    });
    test("uses last year in January", () => {
        expect(defaultWrappedYear(new Date(2027, 0, 15))).toBe(2026);
    });
});

describe("copy helpers", () => {
    test("compares big totals to marathons", () => {
        expect(distanceComparison(160934.4)).toBe("that's 3.8 marathons, stroller edition.");
    });
    test("compares small totals to track laps", () => {
        expect(distanceComparison(10000)).toBe("that's 25 laps around a track 🏟️");
    });
    test("rank lines by placement", () => {
        expect(rankLine(1, 87)).toMatch("main character");
        expect(rankLine(3, 87)).toMatch("podium");
        expect(rankLine(10, 87)).toBe("top 12% of stroller pushers. we love to see it.");
        expect(rankLine(80, 87)).toMatch("every mile counts");
    });
    test("cleanTitle strips hashtags including partial distances", () => {
        expect(cleanTitle("Sunday run #strollerstats(2.5) #packmiles")).toBe("Sunday run");
        expect(cleanTitle(null)).toBe("");
    });
    test("share text includes the total and the site", () => {
        expect(shareText(baseData)).toBe("my 2026 stroller wrapped: 100 stroller miles 🐣 get yours at strollerstats.com");
    });
    test("share text falls back to carrier miles for pack-only users", () => {
        const data = { ...baseData, stroller: { ...baseData.stroller, total_distance: 0 }, pack: { total_distance: 8046.72, activity_count: 2 } };
        expect(shareText(data)).toBe("my 2026 stroller wrapped: 5 carrier miles 🐣 get yours at strollerstats.com");
    });
});

describe("buildSlides", () => {
    test("full story for an opted-in stroller user", () => {
        expect(keys(buildSlides(baseData))).toEqual(["intro", "total", "split", "longest", "busiest", "rank", "share"]);
    });

    test("intro mentions the user's units", () => {
        expect(buildSlides(baseData)[0].sub).toBe("let's look back at your 2026 stroller miles.");
        expect(buildSlides({ ...baseData, distance_unit: "kilometer" })[0].sub).toBe("let's look back at your 2026 stroller kilometers.");
    });

    test("uses kilometers when the user prefers them", () => {
        const slides = buildSlides({ ...baseData, distance_unit: "kilometer" });
        expect(slides.find((s) => s.key === "total").big).toBe("160.9");
        expect(slides.find((s) => s.key === "total").headline).toBe("stroller kilometers this year.");
    });

    test("rank slide says which year it covers", () => {
        const rank = buildSlides(baseData).find((s) => s.key === "rank");
        expect(rank.eyebrow).toBe("2026 RANK");
        expect(rank.headline).toBe("of 87 stroller pushers in 2026.");
    });

    test("adds a pack slide when there are pack miles", () => {
        const slides = buildSlides({ ...baseData, pack: { total_distance: 8046.72, activity_count: 2 } });
        expect(keys(slides)).toContain("pack");
    });

    test("nudges users who aren't on the leaderboard", () => {
        const slides = buildSlides({ ...baseData, leaderboard: { opted_in: false, rank: null, participants: null } });
        expect(keys(slides)).toContain("rank-nudge");
        expect(keys(slides)).not.toContain("rank");
    });

    test("skips rank for opted-in users with no rank", () => {
        const slides = buildSlides({ ...baseData, leaderboard: { opted_in: true, rank: null, participants: 5 } });
        expect(keys(slides)).not.toContain("rank");
        expect(keys(slides)).not.toContain("rank-nudge");
    });

    test("pack-only users get intro, pack, and share", () => {
        const slides = buildSlides({
            ...baseData,
            stroller: { ...baseData.stroller, total_distance: 0 },
            pack: { total_distance: 8046.72, activity_count: 2 },
            leaderboard: { opted_in: true, rank: null, participants: 5 },
        });
        expect(keys(slides)).toEqual(["intro", "pack", "share"]);
    });

    test("returns no slides when there's nothing to show", () => {
        expect(buildSlides({ ...baseData, stroller: { ...baseData.stroller, total_distance: 0 }, pack: null })).toEqual([]);
    });

    test("longest slide quotes the cleaned-up title", () => {
        const longest = buildSlides(baseData).find((s) => s.key === "longest");
        expect(longest.sub).toMatch('"Half!"');
        expect(longest.sub).not.toMatch("#strollerstats");
    });
});
