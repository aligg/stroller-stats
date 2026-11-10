import {useLocation} from "react-router-dom"
import {useState} from "react"
import {signOut} from "firebase/auth"
import {auth} from "../utils/firebase"

const logout = async (evt) => {
    // Wait for sign-out before navigating, or the reload can restore the session.
    evt.preventDefault()
    await signOut(auth)
    window.localStorage.clear()
    window.location.assign("/")
}

const Nav = ({loggedIn}) => {

    const location = useLocation()
    let isLoggedIn = loggedIn || location.state
    const [menuVisible, setDisplayMenu] = useState(false)
    const toggleMenu = () => {
        setDisplayMenu(!menuVisible)
    }

    return (
        <nav className="navbar">
            <a href="/"><img src="/logo.png" alt="stroller" height="50px"/></a>
            {isLoggedIn && (<div id="nav-container">
                {menuVisible && (<div className="menu-items">
                    <li><a href="/">Home</a></li>
                    <li><a href="/about">About+FAQ </a></li>
                    <li><a href="/hall-of-fame">Hall of Fame </a></li>
                    <li><a href="/wrapped">Wrapped 🎁</a></li>
                    <li><a href="/settings">Settings </a></li>
                    <li><a href="/" onClick={logout}>Logout</a></li>
                </div>)}
                <img src={`/${menuVisible ? "close" : "hamburger"}.png`} height="50px" alt="hamburger menu" onClick={toggleMenu}/>
            </div>)}
  </nav>
    )
}

export default Nav