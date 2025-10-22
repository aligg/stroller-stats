import { useEffect, useState } from "react";
import Loading from "./Loading";
import { getDistance } from "../utils/getDistance";

const HallOfFame = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const retrieveData = async () => {
      const response = await fetch(
        "https://us-central1-stroller-stats.cloudfunctions.net/app/hall-of-fame"
      );
      const data = await response.json();
      setData(data);
    };
    retrieveData();
  }, []);

  if (!data) return <main><Loading /><p>Just a sec! Crunching awesome hall of famer data</p></main>;

  const winnerStyle = {
    fontWeight: "bold",
    fontSize: "1.2rem",
    padding: "0.75rem 1rem",
    background: "linear-gradient(135deg, #ffd6f0, #c6b7ff)",
    borderRadius: "12px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
    marginBottom: "0.75rem",
    position: "relative",
  };

  const sparkleStyle = {
    position: "absolute",
    top: "-0.25rem",
    right: "-0.25rem",
    fontSize: "1.2rem",
  };

  const honorableStyle = {
    marginBottom: "0.5rem",
    paddingLeft: "0.5rem",
  };

  const renderTopActivities = (activities) => {
    if (!activities || activities.length === 0) return <p>No data</p>;

    const winner = activities[0];
    const honorable = activities.slice(1);

    return (
      <div style={{ marginLeft: "1rem" }}>
        <div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>Winner</div>
        <div style={winnerStyle}>
          <span style={sparkleStyle}>✨</span>
          👑 {winner.first_name}:{" "}
          <a
            href={`https://www.strava.com/activities/${winner.activity_id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "underline", color: "#5b21b6" }}
          >
            {winner.title}
          </a>{" "}
          — {getDistance(winner.distance).toFixed(2)} miles (
          {new Date(winner.start_date).toLocaleDateString()})
        </div>

        {honorable.length > 0 && (
          <>
            <div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>Honorable Mentions</div>
            {honorable.map((a, idx) => (
              <div key={a.activity_id} style={honorableStyle}>
                {idx + 2}. 🏆 {a.first_name}:{" "}
                <a
                  href={`https://www.strava.com/activities/${a.activity_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "underline", color: "#5b21b6" }}
                >
                  {a.title}
                </a>{" "}
                — {getDistance(a.distance).toFixed(2)} miles (
                {new Date(a.start_date).toLocaleDateString()})
              </div>
            ))}
          </>
        )}
      </div>
    );
  };

  const renderTopTotals = (totals) => {
    if (!totals || totals.length === 0) return <p>No data</p>;

    const winner = totals[0];
    const honorable = totals.slice(1);

    return (
      <div style={{ marginLeft: "1rem" }}>
        <div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>Winner</div>
        <div style={winnerStyle}>
          <span style={sparkleStyle}>✨</span>
          👑{" "}
          <a
            href={`https://www.strava.com/athletes/${winner.user_id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "underline", color: "#5b21b6" }}
          >
            {winner.first_name}
          </a>{" "}
          — {getDistance(winner.total_distance).toFixed(2)} miles
        </div>

        {honorable.length > 0 && (
          <>
            <div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>Honorable Mentions</div>
            {honorable.map((u, idx) => (
              <div key={u.user_id} style={honorableStyle}>
                {idx + 2}. 🏆{" "}
                <a
                  href={`https://www.strava.com/athletes/${u.user_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "underline", color: "#5b21b6" }}
                >
                  {u.first_name}
                </a>{" "}
                — {getDistance(u.total_distance).toFixed(2)} miles
              </div>
            ))}
          </>
        )}
      </div>
    );
  };

  return (
    <main style={{ padding: "1rem" }}>
      <h1 style={{ textAlign: "center", marginBottom: "2rem" }}>🏆 Hall of Fame 🏆</h1>

      <section>
        <h2>Longest stroller run</h2>
        {renderTopActivities(data.top_runs_ever)}
      </section>

      <section>
        <h2>Longest stroller walk</h2>
        {renderTopActivities(data.top_walks_ever)}
      </section>

      <section>
        <h2>Lifetime top stroller run mileage</h2>
        {renderTopTotals(data.lifetime_totals.runs)}
      </section>

      <section>
        <h2>Lifetime top stroller walk mileage</h2>
        {renderTopTotals(data.lifetime_totals.walks)}
      </section>

      <section>
        <h2>{`${new Date().getFullYear()} top stroller run mileage`}</h2>
        {renderTopTotals(data.this_year_totals.runs)}
      </section>

      <section>
        <h2>{`${new Date().getFullYear()} top stroller walk mileage`}</h2>
        {renderTopTotals(data.this_year_totals.walks)}
      </section>
    </main>
  );
};

export default HallOfFame;
