export default function PublicFooter({ organization }) {
  return (
    <footer className="public-footer">
      <p>{organization.name}</p>
      <p>Public website content is prepared for CMS-managed updates.</p>
    </footer>
  );
}
