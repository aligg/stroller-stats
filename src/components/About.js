import React from "react"
import Settings from './Settings';
import { useLocation } from 'react-router-dom'

const About = () => {
    const location = useLocation();
    return (
        <main>
            <h1>Track your stroller miles with Stroller Stats.</h1>
            <ul>
                <li>Add #strollerstats to the description of any Strava walk or run and we'll track your stroller miles</li>
                <li>When you grant write access, we'll also update your description to share month to date stroller mileage from your activity</li>
                <li>You can revoke access anytime</li>
                <li>Compete with friends and family to see who is getting that baby out the most!</li>
            </ul>
            {location.pathname === "/about" && (
                <div>
                    <h1>FAQ</h1>
                    <h2>How do I track my stroller stats?</h2>
                    <p>Add #strollerstats to your activity description. #strollermiles will work too! You have to update your description at the same time that you make a title change so that Strava's webhook will send your changes.</p>
                    <h2>How can I add stroller miles from past activities?</h2>
                    <p>I haven't made a 'click to pull in all your past activities' mechanism yet. However, if you add #strollerstats to your activity description and also make a small title change at the same time, the app will pull it in. Unfortunately you do have to change the title at the same time due to how Strava webhooks work!</p>
                    <h2>How can I report a bug or submit a feature request?</h2>
                    <p>Feel free to file an issue in the <a href="https://github.com/aligg/stroller-stats" target="_blank" rel="noreferrer">github project</a>. Code contributions are welcome! My <a href="https://twitter.com/aliglenesk" target="_blank" rel="noreferrer">Twitter DMs</a> are also open if that's an easier way for you to reach out.</p>
                    <Settings />   
                </div>
            )}
        </main>   
    )
}

export default About;