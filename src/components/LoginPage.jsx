import { createSignal, Show } from "solid-js";

const API_BASE = "https://api.alexbierhance.com";

function LoginPage(props) {
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ password: password() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      props.onSuccess(data.sessionToken);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="auth-box">
      <h1>Admin Login</h1>
      <form onSubmit={handleLogin}>
        <div class="form-group">
          <label for="password">Admin Password</label>
          <input
            type="password"
            id="password"
            value={password()}
            onInput={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            required
            disabled={loading()}
          />
        </div>
        <Show when={error()}>
          <p class="error-message">{error()}</p>
        </Show>
        <button type="submit" class="submit-btn" disabled={loading()}>
          {loading() ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}

export default LoginPage;
