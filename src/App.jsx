import { createEffect, createSignal, Show } from "solid-js";
import lightIcon from "./assets/light-mode.svg";
import darkIcon from "./assets/dark-mode.svg";
import LoginPage from "./components/LoginPage";
import TwoFactorPage from "./components/TwoFactorPage";
import LogsPage from "./components/LogsPage";
import "./App.css";

// Auth page states
const PAGE_LOGIN = "login";
const PAGE_2FA = "2fa";
const PAGE_LOGS = "logs";

function App() {
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";

  // Theme state
  const [darkTheme, setDarkTheme] = createSignal(systemTheme === "dark");

  // Auth state
  const [currentPage, setCurrentPage] = createSignal(PAGE_LOGIN);
  const [sessionToken, setSessionToken] = createSignal("");

  const cssSetProp = (prop, value) =>
    document.documentElement.style.setProperty(prop, value);

  createEffect(() => {
    if (!darkTheme()) {
      cssSetProp("--main-bg-img", "var(--light-bg-img");
      cssSetProp("--main-bg-color", "var(--light-bg-color");
      cssSetProp("--main-color", "var(--light-color");
    } else {
      cssSetProp("--main-bg-img", "var(--dark-bg-img");
      cssSetProp("--main-bg-color", "var(--dark-bg-color");
      cssSetProp("--main-color", "var(--dark-color");
    }
  });

  const handleLoginSuccess = (token) => {
    setSessionToken(token);
    setCurrentPage(PAGE_2FA);
  };

  const handleVerifySuccess = () => {
    setCurrentPage(PAGE_LOGS);
  };

  const handleBackToLogin = () => {
    setSessionToken("");
    setCurrentPage(PAGE_LOGIN);
  };

  const handleLogout = async () => {
    // Call logout endpoint to clear HTTP-only cookie
    try {
      await fetch("https://api.alexbierhance.com/v1/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      // Continue with logout even if request fails
    }
    setSessionToken("");
    setCurrentPage(PAGE_LOGIN);
  };

  return (
    <>
      <button
        class="hover-underline top"
        onClick={() => setDarkTheme((theme) => !theme)}
      >
        Use {darkTheme() ? "light" : "dark"} theme{" "}
        <img
          src={darkTheme() ? lightIcon : darkIcon}
          class="logo"
          alt="theme icon"
        />
      </button>

      <article id="main">
        <Show when={currentPage() === PAGE_LOGIN}>
          <LoginPage onSuccess={handleLoginSuccess} />
        </Show>

        <Show when={currentPage() === PAGE_2FA}>
          <TwoFactorPage
            sessionToken={sessionToken()}
            onSuccess={handleVerifySuccess}
            onBack={handleBackToLogin}
          />
        </Show>

        <Show when={currentPage() === PAGE_LOGS}>
          <LogsPage onLogout={handleLogout} onSessionExpired={handleLogout} />
        </Show>
      </article>
    </>
  );
}

export default App;
