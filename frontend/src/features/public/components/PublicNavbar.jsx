export default function PublicNavbar({ organization }) {
  return (
    <header className="public-navbar">
      <a className="public-navbar__brand" href="#home" aria-label={`${organization.name} home`}>
        {organization.name}
      </a>
      <nav className="public-navbar__links" aria-label="Public navigation">
        <a href="#about">About</a>
        <a href="#events">Events</a>
        <a href="#articles">Articles</a>
        <a href="#team">Team</a>
        <a href="#contact">Contact</a>
      </nav>
      <a className="public-navbar__login" href="/login">
        Login
      </a>
    </header>
  );
}
