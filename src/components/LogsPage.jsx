import { createSignal, onMount, Show, For } from "solid-js";
import { API_BASE } from "../config";

function LogsPage(props) {
  const [logs, setLogs] = createSignal([]);
  const [pagination, setPagination] = createSignal(null);
  const [currentPage, setCurrentPage] = createSignal(1);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");
  const [search, setSearch] = createSignal("");
  const [selectedCodes, setSelectedCodes] = createSignal([]);
  const [availableCodes, setAvailableCodes] = createSignal([]);
  const [showCodeFilter, setShowCodeFilter] = createSignal(false);
  const [columns, setColumns] = createSignal([]);
  let searchTimeout;

  const fetchMeta = async () => {
    try {
      const response = await fetch(`${API_BASE}/v1/logs/meta`, {
        credentials: "include",
      });
      if (response.ok) {
        const res = await response.json();
        setColumns(res.data.values || []);
      }
    } catch (err) {
      console.error("Failed to fetch log meta:", err);
    }
  };

  const fetchAvailableCodes = async () => {
    try {
      const response = await fetch(`${API_BASE}/v1/logs/meta/code`, {
        credentials: "include",
      });
      if (response.ok) {
        const res = await response.json();
        setAvailableCodes(res.data.values || []);
       if (response.ok) {
         const res = await response.json();
         setAvailableCodes(res.data.values || []);
       }
      }
    } catch (err) {
      console.error("Failed to fetch available codes:", err);
    }
  };

  const fetchLogs = async (page = 1, searchQuery = search(), codes = selectedCodes()) => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({ page: page.toString() });
      if (searchQuery) {
        params.set("search", searchQuery);
      }
      if (codes && codes.length > 0) {
        codes.forEach((c) => params.append("code", c));
      }
      const response = await fetch(`${API_BASE}/v1/logs?${params}`, {
        credentials: "include",
      });

      if (response.status === 401) {
        // Token expired or invalid
        props.onSessionExpired?.();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch logs");
      }

      setLogs(data.data);
      setPagination(data.pagination);
      setCurrentPage(page);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  onMount(() => {
    fetchMeta();
    fetchAvailableCodes();
    fetchLogs(1);
  });

  const goToPage = (page) => {
    if (page >= 1 && page <= pagination()?.totalPages) {
      fetchLogs(page, search(), selectedCodes());
    }
  };

  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearch(value);
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      setCurrentPage(1);
      fetchLogs(1, value, selectedCodes());
    }, 500);
  };

  const handleCodeChange = (e) => {
    const code = e.target.value;
    let updated = [...selectedCodes()];
    if (e.target.checked) {
      if (!updated.includes(code)) updated.push(code);
    } else {
      updated = updated.filter((c) => c !== code);
    }
    setSelectedCodes(updated);
    setCurrentPage(1);
    fetchLogs(1, search(), updated);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getTypeClass = (type) => {
    switch (type) {
      case "ERROR":
        return "type-error";
      case "WARN":
        return "type-warn";
      case "INFO":
        return "type-info";
      default:
        return "";
    }
  };

  const getCodeClass = (code) => {
    if (code >= 500) return "code-error";
    if (code >= 400) return "code-warn";
    if (code >= 200 && code < 300) return "code-success";
    return "";
  };

  return (
    <div class="logs-container">
      <div class="logs-header">
        <h1>Request Logs</h1>
        <div class="logs-actions">
          <input
            type="text"
            class="search-input"
            placeholder="Search logs..."
            value={search()}
            onInput={handleSearchInput}
          />
          <div class="code-filter-wrapper">
            <button
              class="filter-btn"
              onClick={() => setShowCodeFilter(!showCodeFilter())}
            >
              Codes {selectedCodes().length > 0 ? `(${selectedCodes().length})` : ""}
            </button>
            <Show when={showCodeFilter()}>
              <div class="code-filter-dropdown">
                <For each={availableCodes()}>
                  {(code) => (
                    <label>
                      <input
                        type="checkbox"
                        value={code}
                        checked={selectedCodes().includes(String(code))}
                        onChange={handleCodeChange}
                      /> {code}
                    </label>
                  )}
                </For>
              </div>
            </Show>
          </div>
          <button class="refresh-btn" onClick={() => fetchLogs(currentPage(), search(), selectedCodes())} disabled={loading()}>
            {loading() ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <Show when={error()}>
        <p class="error-message">{error()}</p>
      </Show>

      <Show when={loading() && logs().length === 0}>
        <p class="loading-text">Loading logs...</p>
      </Show>

      <Show when={logs().length > 0}>
        <div class="table-wrapper">
          <table class="logs-table">
            <thead>
              <tr>
                <For each={columns()}>
                  {(col) => <th>{col}</th>}
                </For>
              </tr>
            </thead>
            <tbody>
              <For each={logs()}>
                {(log) => (
                  <tr>
                    <td>{log.id}</td>
                    <td class="nowrap">{formatDate(log.created_at)}</td>
                    <td><span class="method-badge">{log.method}</span></td>
                    <td class="route-cell">{log.route}</td>
                    <td><span class={`code-badge ${getCodeClass(log.code)}`}>{log.code}</span></td>
                    <td><span class={`type-badge ${getTypeClass(log.type)}`}>{log.type}</span></td>
                    <td class="ip-cell">{log.ip}</td>
                    <td class="description-cell">{log.description || "-"}</td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>

        <Show when={pagination()}>
          <div class="pagination">
            <button
              class="pagination-btn"
              onClick={() => goToPage(1)}
              disabled={currentPage() === 1 || loading()}
            >
              First
            </button>
            <button
              class="pagination-btn"
              onClick={() => goToPage(currentPage() - 1)}
              disabled={currentPage() === 1 || loading()}
            >
              Previous
            </button>
            <span class="pagination-info">
              Page {currentPage()} of {pagination().totalPages} ({pagination().totalCount} total)
            </span>
            <button
              class="pagination-btn"
              onClick={() => goToPage(currentPage() + 1)}
              disabled={currentPage() === pagination().totalPages || loading()}
            >
              Next
            </button>
            <button
              class="pagination-btn"
              onClick={() => goToPage(pagination().totalPages)}
              disabled={currentPage() === pagination().totalPages || loading()}
            >
              Last
            </button>
          </div>
        </Show>
      </Show>

      <Show when={!loading() && logs().length === 0 && !error()}>
        <p class="no-logs">No logs found</p>
      </Show>

      <div class="logs-footer">
        <button class="submit-btn logout-btn" onClick={props.onLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default LogsPage;
