function LandingPage(props) {
  return (
    <div class="auth-box">
      <h1>Welcome to the Admin Panel</h1>
      <div class="form-group">
        <button class="submit-btn" onClick={props.onViewLogs}>
          View Logs
        </button>
      </div>
      <button class="hover-underline" onClick={props.onLogout}>
        Logout
      </button>
    </div>
  );
}

export default LandingPage;
