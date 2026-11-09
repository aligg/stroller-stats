import { getDistance } from "./getDistance";

const MARATHON_METERS = 42195;
const TRACK_LAP_METERS = 400;

// In January people still want last year's recap.
export const defaultWrappedYear = (now = new Date()) =>
    now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

export const formatDistance = (meters, isKilometers, maxDigits = 1) =>
    getDistance(meters, isKilometers).toLocaleString("en-US", { maximumFractionDigits: maxDigits });

export const monthName = (month) =>
    new Date(Date.UTC(2000, month - 1, 1)).toLocaleString("en-US", { month: "long", timeZone: "UTC" });

const seasonForMonth = (month) => {
    if (month === 12 || month <= 2) return "winter";
    if (month <= 5) return "spring";
    if (month <= 8) return "summer";
    return "fall";
};

export const distanceComparison = (meters) => {
    const marathons = meters / MARATHON_METERS;
    if (marathons >= 2) {
        return `that's ${marathons.toFixed(1)} marathons, stroller edition.`;
    }
    const laps = Math.round(meters / TRACK_LAP_METERS);
    return `that's ${laps.toLocaleString("en-US")} laps around a track 🏟️`;
};

export const rankLine = (rank, participants) => {
    if (rank === 1) return "👑 main character behavior.";
    if (rank <= 3) return "🏆 podium energy.";
    const percentile = Math.ceil((rank / participants) * 100);
    if (percentile <= 50) return `top ${percentile}% of stroller pushers. we love to see it.`;
    return "every mile counts and yours did 💙";
};

// Strip #strollerstats-style tags so the title reads like the user wrote it.
export const cleanTitle = (title) =>
    (title || "").replace(/#\w+(\([\d.]+\))?/g, "").replace(/\s+/g, " ").trim();

const sportLabel = (sportType) => (sportType === "Walk" ? "walk" : "run");

export const shareText = (data) => {
    const isKm = data.distance_unit === "kilometer";
    const { stroller, pack } = data;
    const total = stroller.total_distance > 0
        ? `${formatDistance(stroller.total_distance, isKm)} stroller ${data.distance_unit}s`
        : `${formatDistance(pack.total_distance, isKm)} carrier ${data.distance_unit}s`;
    return `my ${data.year} stroller wrapped: ${total} 🐣 get yours at strollerstats.com`;
};

/**
 * Story slides for a Wrapped response. Returns [] when there's nothing to show.
 * The share card is always the last slide ({ key: "share" }).
 */
export const buildSlides = (data) => {
    const { stroller, pack, leaderboard, year } = data;
    const unit = data.distance_unit;
    const isKm = unit === "kilometer";
    const hasStroller = stroller.total_distance > 0;
    if (!hasStroller && !pack) {
        return [];
    }

    const slides = [{
        key: "intro",
        emoji: "🐣",
        eyebrow: `STROLLER_WRAPPED_${year}`,
        headline: `hey ${data.first_name} 👋`,
        sub: `let's look back at your ${year} in the stroller.`,
    }];

    if (hasStroller) {
        slides.push({
            key: "total",
            eyebrow: "TOTAL_DISTANCE",
            big: formatDistance(stroller.total_distance, isKm),
            headline: `stroller ${unit}s this year.`,
            sub: distanceComparison(stroller.total_distance),
        });
        slides.push({
            key: "split",
            eyebrow: "RUN_VS_WALK",
            headline: `${stroller.run_count} stroller runs + ${stroller.walk_count} stroller walks`,
            sub: `${formatDistance(stroller.run_distance, isKm)} ${unit}s running, ${formatDistance(stroller.walk_distance, isKm)} ${unit}s walking. that's giving cardio.`,
        });
        const { longest } = stroller;
        const title = cleanTitle(longest.title);
        slides.push({
            key: "longest",
            eyebrow: "LONGEST_PUSH",
            big: formatDistance(longest.distance, isKm),
            headline: `${unit}s on ${new Date(longest.start_date).toLocaleDateString("en-US", { month: "long", day: "numeric" })}.`,
            sub: `${title ? `"${title}" — ` : ""}one whole ${sportLabel(longest.sport_type)} with the stroller. the baby slept through it (probably).`,
        });
        const { busiest_month: busiest } = stroller;
        slides.push({
            key: "busiest",
            eyebrow: "BUSIEST_MONTH",
            headline: `${monthName(busiest.month)} was your month.`,
            sub: `${formatDistance(busiest.distance, isKm)} ${unit}s. hot stroller ${seasonForMonth(busiest.month)} 🔥`,
        });
    }

    if (pack) {
        slides.push({
            key: "pack",
            eyebrow: "CARRIER_MILES",
            big: formatDistance(pack.total_distance, isKm),
            headline: `${unit}s with baby in the carrier.`,
            sub: "core strength unlocked 💪",
        });
    }

    if (leaderboard.opted_in && leaderboard.rank) {
        slides.push({
            key: "rank",
            eyebrow: "LEADERBOARD",
            big: `#${leaderboard.rank}`,
            headline: `of ${leaderboard.participants} stroller pushers.`,
            sub: rankLine(leaderboard.rank, leaderboard.participants),
        });
    } else if (!leaderboard.opted_in) {
        slides.push({
            key: "rank-nudge",
            eyebrow: "LEADERBOARD",
            emoji: "👀",
            headline: "curious where you rank?",
            sub: "opt in to the leaderboard in settings and next year you'll find out.",
            link: { href: "/settings", label: "go to settings" },
        });
    }

    slides.push({ key: "share" });
    return slides;
};
