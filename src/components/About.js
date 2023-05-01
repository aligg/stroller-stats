import { useLocation } from 'react-router-dom'

const About = () => {

    const location = useLocation();
    console.log(location.pathname)
    return (
        <main>
            <h1>Track your stroller miles with Stroller Stats.</h1>
            <ul>
                <li>Add #strollerstats to the description of any Strava walk or run and we'll track your miles</li>
                <li>If you grant write access, we'll also update your description to share stroller data on your activity</li>
                <li>You can revoke access anytime</li>
                <li>Compete with friends and family to see who is getting that baby out the most!</li>
            </ul>
            {location.pathname === "/about" && (
                <div>
                    <h1>FAQ</h1>
                    <h2>How can I add stroller miles from past activities?</h2>
                    <p>I haven't made a 'click to pull in all your past activities' mechanism yet. However, if you add #strollerstats to your activity description and also make a small title change at the same time, the app will pull it in. Unfortunately you do have to change the title at the same time due to how Strava webhooks work!</p>
                </div>
            )}
        </main>   
    )
}

export default About;