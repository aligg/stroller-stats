import { forwardRef } from "react";
import { cleanTitle, distanceComparison, formatDistance, monthName } from "../utils/wrapped";

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
                        <Stat label="RUNS" value={`${stroller.run_count} · ${formatDistance(stroller.run_distance, isKm, 0)} ${unitShort}`} />
                        <Stat label="WALKS" value={`${stroller.walk_count} · ${formatDistance(stroller.walk_distance, isKm, 0)} ${unitShort}`} />
                        <Stat
                            label="LONGEST PUSH"
                            value={`${formatDistance(stroller.longest.distance, isKm)} ${unitShort}`}
                        />
                        <Stat label="BUSIEST MONTH" value={monthName(stroller.busiest_month.month)} />
                    </>
                )}
                {hasStroller && pack && (
                    <Stat label="CARRIER" value={`${formatDistance(pack.total_distance, isKm)} ${unitShort}`} />
                )}
                {leaderboard.opted_in && leaderboard.rank && (
                    <Stat label="LEADERBOARD" value={`#${leaderboard.rank} of ${leaderboard.participants}${leaderboard.rank === 1 ? " 👑" : ""}`} />
                )}
            </div>

            {hasStroller && cleanTitle(stroller.longest.title) && (
                <p className="wrapped-card-quote">longest push: "{cleanTitle(stroller.longest.title)}"</p>
            )}

            <div className="wrapped-card-footer">
                <span className="wrapped-card-url">strollerstats.com</span>
                <img className="wrapped-card-strava" src="/powered-by-strava.png" alt="Powered by Strava" />
            </div>
        </div>
    );
});

export default WrappedShareCard;
