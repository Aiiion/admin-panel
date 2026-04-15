import { createEffect, createSignal, onMount, Show } from "solid-js";
import lightIcon from "./assets/light-mode.svg";
import darkIcon from "./assets/dark-mode.svg";
import LoginPage from "./components/LoginPage";
import TwoFactorPage from "./components/TwoFactorPage";
import LogsPage from "./components/LogsPage";
import { API_BASE } from "./config";
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
  const [checkingSession, setCheckingSession] = createSignal(true);

  // Check for existing valid session on mount
  onMount(async () => {
    try {
      const response = await fetch(`${API_BASE}/v1/auth/verify-token`, {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        // Session is valid, skip to logs page
        setCurrentPage(PAGE_LOGS);
      }
    } catch (err) {
      // Session invalid or network error, stay on login
    } finally {
      setCheckingSession(false);
    }
  });

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
      await fetch(`${API_BASE}/v1/auth/logout`, {
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
        <Show when={checkingSession()}>
          <div class="auth-box">
            <p>Checking session...</p>
          </div>
        </Show>

        <Show when={!checkingSession() && currentPage() === PAGE_LOGIN}>
          <LoginPage onSuccess={handleLoginSuccess} />
        </Show>

        <Show when={!checkingSession() && currentPage() === PAGE_2FA}>
          <TwoFactorPage
            sessionToken={sessionToken()}
            onSuccess={handleVerifySuccess}
            onBack={handleBackToLogin}
          />
        </Show>

        <Show when={!checkingSession() && currentPage() === PAGE_LOGS}>
          <LogsPage onLogout={handleLogout} onSessionExpired={handleLogout} />
        </Show>
      </article>
    </>
  );
}

export default App;
