const Nav = ({loggedIn}) => {
    return (
        <nav className="navMenu">
            <img src="logo.png" alt="stroller" height="50px"/>
            <div id="links-container">
                {loggedIn && <a href="/about">About</a>}
                {loggedIn && <a href="/" onClick={() => window.localStorage.clear()}>Logout</a>}
            </div>
  </nav>
    )

}

export default Nav