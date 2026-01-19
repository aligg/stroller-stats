import React from "react";

export const Intro = () => {
  return (
    <ul>
      <li>
      Connect with Strava to get started.
    </li>
    <li>
      Add #strollerstats to the description of any Strava walk or run and
      we'll track your stroller miles (or kilometers) automatically.
    </li>
    <li>
      When you grant write access, we'll also update your description to
      share month-to-date stroller mileage from your activity. If you'd like
      stroller stats to be counted for "Only Me" activities, keep "View data
      about your private activities" checked.
    </li>
    <li>You can revoke access anytime.</li>
    <li>
      Compete with friends and family to see who is getting that baby out
      the most!
    </li>
  </ul>
  )
}

const About = () => {
  return (
    <main>
      <h1>Track your stroller miles with Stroller Stats.</h1>
        <Intro />
        <div>
          <h1>FAQ</h1>
          <h2>How do I track my stroller stats?</h2>
          <p>
            Add #strollerstats to your activity description. #strollermiles will
            work too! You have to update your description at the same time that
            you make a title change so that Strava's webhook will send your
            changes. Tracking stroller stats works for Run or Walk activity types.
          </p>
          <h2>How can I add stroller miles from past activities?</h2>
          <p>
            If you add #strollerstats to your activity
            description and also make a small title change at the same time, the
            app will pull it in. Unfortunately you do have to change the title
            at the same time due to how Strava webhooks work.
          </p>
          <h2>Can I track when I have the baby in the frontpack or backpack?</h2>
          <p>
            New in 2026 (inspired by my second baby!) you can add #packmiles or #packstats to your activity to track your pack distance. Tracking pack distance works for walk and hike activity types. Pack activities are not currently included in monthly data, leaderboards, or hall of fame. Since this is a new feature, <a href="mailto:ali@strollerstats.com">let me know</a> if you have requests, bug reports or feedback.
          </p>
          <h2>Does stroller stats work for activities visible to "Only Me"?</h2>
          <p>
            Stroller stats <i>can</i> work for Strava activities visible only to
            you. If you'd like your "Only Me" activities to be counted, keep
            "View data about your private activities" checked during the
            authorization step. You can change your choice at anytime by logging
            out and logging back in again and changing your selections.
          </p>
          <h2>How can I track only part of my run as stroller miles?</h2>
          <p>
            Did you share stroller duties with another adult? Add your mileage in parentheses after #strollerstats - for example,
            #strollerstats(1.5) will only log 1.5 miles of your activity as
            stroller miles (or 1.5 kilometers if your preference is set to kilometers).
          </p>
          <h2>How can I switch my stroller stats preference to kilometers?</h2>
          <p>
           Head on over to <a href="/settings">settings</a> and make your selection. Note this is a new feature - send me your feedback!
          </p>
          <h2>How do I opt in to the leaderboard?</h2>
          <p>
           Head on over to <a href="/settings">settings</a> and make your selection. Everyone is opted out of the leaderboard to start - you need to opt in :)
          </p>
          <h2>I added #strollerstats to my description but I don't think it worked. What should I do?</h2>
          <p>Here are some suggestions to try:<br></br>
            - Login to strollerstats.com and authorize stroller stats to sync with your strava<br></br>
            - When you add #strollerstats to your activity description, you must modify the title in some way too (i.e if you leave it just as Morning Run it won't work)<br></br>
            - Tag <a
              href="https://www.strava.com/athletes/3438509"
              target="_blank"
              rel="noreferrer"
            >
              Ali Glenesk
            </a> in a comment on your activity to get some help, or send me an email.<br></br>
          </p>
          <h2>How can I report a bug or submit a feature request?</h2>
          <p>
            Feel free to file an issue in the{" "}
            <a
              href="https://github.com/aligg/stroller-stats"
              target="_blank"
              rel="noreferrer"
            >
              github project
            </a>
            . Code contributions are welcome! You can also reach me at <a href="mailto:ali@strollerstats.com">ali@strollerstats.com</a> with questions.
          </p>
          <h2>Want to know your estimated energy expendinture for your stroller run and other cool research-backed stats?</h2>
          <p>
            Check out our friends at {" "}
            <a
              href="https://strollerrunningcalculator.com"
              target="_blank"
              rel="noreferrer"
            >
              Stroller Running Calculator
            </a>
            .
          </p>
        </div>
    </main>
  );
};

export default About;
