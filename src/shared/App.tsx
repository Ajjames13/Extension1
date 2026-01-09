import { useState } from "react";
import { NewReflection } from "../components/NewReflection/NewReflection";
import { ReflectionList } from "../components/ReflectionList/ReflectionList";
import { SettingsPage } from "../components/SettingsPage/SettingsPage";
import "./app.css";

type Page = "popup" | "dashboard";
type DashboardTab = "calendar" | "settings";

interface AppProps {
  page: Page;
}

export const App = ({ page }: AppProps) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>("calendar");

  // --- VIEW 1: EXTENSION POPUP (Quick Entry) ---
  if (page === "popup") {
    // FIX: Added 'app--popup' class to enforce fixed width
    return (
      <div className="app app--popup">
        <header className="app__header-top">
          <div>
            <p className="app__eyebrow">Trade Journal // Pro</p>
            <h1 style={{ fontSize: "20px", margin: "4px 0" }}>QUICK CAPTURE</h1>
          </div>
          <a href="dashboard.html" target="_blank" rel="noreferrer" className="app__link">
            OPEN DASHBOARD ↗
          </a>
        </header>
        
        <main className="app__content">
          <NewReflection />
        </main>
      </div>
    );
  }

  // --- VIEW 2: FULL DASHBOARD (Management) ---
  // FIX: Added 'app--dashboard' class for full width
  return (
    <div className="app app--dashboard">
      <header className="app__header-top">
        <div>
          <p className="app__eyebrow">Performance & Analytics</p>
          <h1>TRADE CENTER</h1>
        </div>
      </header>

      <div className="app__dashboard-layout">
        <nav className="app__tabs">
          <button 
            className={activeTab === "calendar" ? "active" : ""} 
            onClick={() => setActiveTab("calendar")}
          >
            CALENDAR VIEW
          </button>
          <button 
            className={activeTab === "settings" ? "active" : ""} 
            onClick={() => setActiveTab("settings")}
          >
            SETTINGS & CONFIG
          </button>
        </nav>

        <main className="app__content">
          {activeTab === "calendar" ? <ReflectionList /> : <SettingsPage />}
        </main>
      </div>
    </div>
  );
};