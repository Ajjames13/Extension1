import "./app.css";

type AppProps = {
  page: "popup" | "dashboard";
};

const pageCopy = {
  popup: {
    title: "Popup",
    description: "Quick actions live here."
  },
  dashboard: {
    title: "Dashboard",
    description: "A fuller view of your extension data."
  }
};

export const App = ({ page }: AppProps) => {
  const content = pageCopy[page];

  return (
    <main className="app">
      <header className="app__header">
        <p className="app__eyebrow">Extension1</p>
        <h1>{content.title}</h1>
        <p className="app__description">{content.description}</p>
      </header>
      <section className="app__content">
        <div className="app__card">
          <h2>Shared React layout</h2>
          <p>
            Use this space to add UI, hooks, and shared components for both
            pages.
          </p>
        </div>
        <nav className="app__nav">
          {page === "popup" ? (
            <a className="app__link" href="dashboard.html">
              Open dashboard
            </a>
          ) : (
            <a className="app__link" href="popup.html">
              Back to popup
            </a>
          )}
        </nav>
      </section>
    </main>
  );
};
