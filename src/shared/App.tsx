import { useState } from "react";
import { NewReflection } from "../components/NewReflection/NewReflection";
import { ReflectionList } from "../components/ReflectionList/ReflectionList";
import { SettingsPage } from "../components/SettingsPage/SettingsPage";
import { ExportData } from "../components/ExportData/ExportData";
import "./app.css";

type AppProps = {
  page: "popup" | "dashboard";
};

type DashboardTab = "list" | "settings" | "export";

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
  const [activeTab, setActiveTab] = useState<DashboardTab>("list");
  const content = pageCopy[page];

  return (
    <main className="app">
      <header className="app__header">
        <div className="app__header-top">
          <div>
            <p className="app__eyebrow">Extension1</p>
            <h1>{content.title}</h1>
            <p className="app__description">{content.description}</p>
          </div>
          <nav className="app__nav">
            {page === "popup" ? (
              <a className="app__link" href="dashboard.html" target="_blank">
                Open dashboard
              </a>
            ) : null}
          </nav>
        </div>
      </header>

      <section className="app__content">
        {page === "popup" && <NewReflection />}

        {page === "dashboard" && (
          <div className="app__dashboard-layout">
            <div className="app__tabs">
              <button
                type="button"
                className={activeTab === "list" ? "active" : ""}
                onClick={() => setActiveTab("list")}
              >
                Reflections
              </button>
              <button
                type="button"
                className={activeTab === "settings" ? "active" : ""}
                onClick={() => setActiveTab("settings")}
              >
                Settings
              </button>
              <button
                type="button"
                className={activeTab === "export" ? "active" : ""}
                onClick={() => setActiveTab("export")}
              >
                Export
              </button>
            </div>

            {activeTab === "list" && <ReflectionList />}
            {activeTab === "settings" && <SettingsPage />}
            {activeTab === "export" && <ExportData />}
          </div>
        )}
      </section>
    </main>
  );
};