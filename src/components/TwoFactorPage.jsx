import { createSignal, Show } from "solid-js";
import { API_BASE } from "../config";

function TwoFactorPage(props) {
  const [verificationCode, setVerificationCode] = createSignal("");
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/v1/auth/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          sessionToken: props.sessionToken,
          code: verificationCode(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Verification failed");
      }

      // JWT token is now set as HTTP-only cookie by the server
      props.onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="auth-box">
      <h1>Email Verification</h1>
      <p class="sub-text">A verification code has been sent to your email</p>
      <form onSubmit={handleVerify}>
        <div class="form-group">
          <label for="code">Verification Code</label>
          <input
            type="text"
            id="code"
            value={verificationCode()}
            onInput={(e) => setVerificationCode(e.target.value)}
            placeholder="Enter 6-digit code"
            maxLength="6"
            required
            disabled={loading()}
          />
        </div>
        <Show when={error()}>
          <p class="error-message">{error()}</p>
        </Show>
        <button type="submit" class="submit-btn" disabled={loading()}>
          {loading() ? "Verifying..." : "Verify"}
        </button>
      </form>
      <button class="back-btn" onClick={props.onBack}>
        Back to Login
      </button>
    </div>
  );
}

export default TwoFactorPage;
