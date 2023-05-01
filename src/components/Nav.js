import {useLocation} from "react-router-dom"

const Nav = ({loggedIn}) => {
    const location = useLocation()
    const isLoggedIn = loggedIn || location.state

    return (
        <nav className="navMenu">
            <a href="/"><img src="/logo.png" alt="stroller" height="50px"/></a>
            <div id="links-container">
                {isLoggedIn && <a href="/">Home</a>}
                {isLoggedIn && <a href="/about">About</a>}
                {isLoggedIn && <a href="/" onClick={() => window.localStorage.clear()}>Logout</a>}
            </div>
  </nav>
    )

}

export default Nav