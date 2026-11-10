import { forwardRef } from "react";
import { cleanTitle, distanceComparison, formatDistance, formatPace, monthName } from "../utils/wrapped";

const Stat = ({ label, value }) => (
    <div className="wrapped-card-stat">
        <span className="wrapped-card-stat-label">{label}</span>
        <span className="wrapped-card-stat-value">{value}</span>
    </div>
);

// Rendered at 360x640 CSS px and exported at pixelRatio 3 (1080x1920, Instagram story size).
const WrappedShareCard = forwardRef(({ data }, ref) => {
    const { stroller, pack, leaderboard, year } = data;
    const unit = data.distance_unit;
    const isKm = unit === "kilometer";
    const unitShort = isKm ? "km" : "mi";
    const hasStroller = stroller.total_distance > 0;

    // Last grid row: pace and rank when available, outing count as the fallback.
    // A lone extra would leave a gap in the 2-column grid, so show two or none.
    const pace = formatPace(stroller.average_run_speed, isKm);
    const candidates = [];
    if (pace) {
        candidates.push(<Stat key="pace" label="AVG RUN PACE" value={pace} />);
    }
    if (leaderboard.opted_in && leaderboard.rank) {
        candidates.push(<Stat key="rank" label={`${year} RANK`} value={`#${leaderboard.rank} of ${leaderboard.participants}${leaderboard.rank === 1 ? " 👑" : ""}`} />);
    }
    candidates.push(<Stat key="outings" label="STROLLER OUTINGS" value={stroller.activity_count} />);
    const extras = hasStroller && candidates.length >= 2 ? candidates.slice(0, 2) : [];

    return (
        <div className="wrapped-card" ref={ref}>
            <img className="wrapped-card-logo" src="/logo.png" alt="Stroller Stats" />
            <p className="wrapped-card-eyebrow">STROLLER WRAPPED {year}</p>
            <p className="wrapped-card-name">{data.first_name.toLowerCase()}'s year</p>
            <p className="wrapped-card-big">
                {formatDistance(hasStroller ? stroller.total_distance : pack.total_distance, isKm)}
            </p>
            <p className="wrapped-card-unit">{hasStroller ? "stroller" : "carrier"} {unit}s 🐣</p>
            {hasStroller && <p className="wrapped-card-comparison">{distanceComparison(stroller.total_distance)}</p>}

            <div className="wrapped-card-stats">
                {hasStroller && (
                    <>
                        <Stat label="STROLLER RUNS" value={`${formatDistance(stroller.run_distance, isKm, 0)} ${unitShort}`} />
                        <Stat label="STROLLER WALKS" value={`${formatDistance(stroller.walk_distance, isKm, 0)} ${unitShort}`} />
                        <Stat
                            label="LONGEST PUSH"
                            value={`${formatDistance(stroller.longest.distance, isKm)} ${unitShort}`}
                        />
                        <Stat label="BUSIEST MONTH" value={monthName(stroller.busiest_month.month)} />
                    </>
                )}
                {extras}
            </div>

            {hasStroller && cleanTitle(stroller.longest.title) && (
                <p className="wrapped-card-quote">longest push: "{cleanTitle(stroller.longest.title)}"</p>
            )}
            {hasStroller && pack && (
                <p className="wrapped-card-note">plus {formatDistance(pack.total_distance, isKm)} {unit}s in the carrier 💪</p>
            )}

            <div className="wrapped-card-footer">
                <span className="wrapped-card-url">strollerstats.com</span>
                <img className="wrapped-card-strava" src="/powered-by-strava.png" alt="Powered by Strava" />
            </div>
        </div>
    );
});

export default WrappedShareCard;
