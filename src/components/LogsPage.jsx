import { createSignal, onMount, Show, For } from "solid-js";
import { API_BASE } from "../config";
import { getFiltersComponent } from "../filters/index";

function ResourceTable(props) {
  const [rows, setRows] = createSignal([]);
  const [pagination, setPagination] = createSignal(null);
  const [currentPage, setCurrentPage] = createSignal(1);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");
  const [search, setSearch] = createSignal("");
  const [filterParams, setFilterParams] = createSignal([]);
  const [columns, setColumns] = createSignal([]);
  const [metaError, setMetaError] = createSignal("");
  const [tooltip, setTooltip] = createSignal({ text: "", x: 0, y: 0, visible: false });
  let searchTimeout;

  const handleTableMouseMove = (e) => {
    const td = e.target.closest("td");
    if (td) {
      const text = td.textContent?.trim();
      if (text && text !== "-") {
        setTooltip({ text, x: e.clientX, y: e.clientY, visible: true });
        return;
      }
    }
    setTooltip((t) => ({ ...t, visible: false }));
  };

  const handleTableMouseLeave = () => {
    setTooltip((t) => ({ ...t, visible: false }));
  };

  const fetchMeta = async () => {
    try {
      const response = await fetch(`${API_BASE}${props.resource.meta}`, {
        credentials: "include",
      });
      if (response.ok) {
        const res = await response.json();
        setColumns(res.data.values || []);
        setMetaError("");
      } else {
        setMetaError("Failed to load column headers");
      }
    } catch {
      setMetaError("Failed to load column headers");
    }
  };

  const FiltersComponent = getFiltersComponent(props.resource.name);

  const fetchRows = async (page = 1, searchQuery = search(), filterEntries = filterParams()) => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({ page: page.toString() });
      if (searchQuery) params.set("search", searchQuery);
      filterEntries.forEach(([key, value]) => params.append(key, value));
      const response = await fetch(`${API_BASE}${props.resource.endpoint}?${params}`, {
        credentials: "include",
      });

      if (response.status === 401) {
        props.onSessionExpired?.();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch data");
      }

      setRows(data.data);
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
    fetchRows(1);
  });

  const goToPage = (page) => {
    if (page >= 1 && page <= pagination()?.totalPages) {
      fetchRows(page, search(), filterParams());
    }
  };

  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearch(value);
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      setCurrentPage(1);
      fetchRows(1, value, filterParams());
    }, 500);
  };

  const handleFilterChange = (entries) => {
    setFilterParams(entries);
    setCurrentPage(1);
    fetchRows(1, search(), entries);
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
    <div class="resource-table-section">
      <div class="logs-actions">
        <input
          type="text"
          class="search-input"
          placeholder={`Search ${props.resource.name}...`}
          value={search()}
          onInput={handleSearchInput}
        />
        {FiltersComponent && <FiltersComponent resource={props.resource} onChange={handleFilterChange} />}
        <button class="refresh-btn" onClick={() => fetchRows(currentPage(), search(), filterParams())} disabled={loading()}>
          {loading() ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <Show when={error()}>
        <p class="error-message">{error()}</p>
      </Show>

      <Show when={loading() && rows().length === 0}>
        <p class="loading-text">Loading...</p>
      </Show>

      <Show when={rows().length > 0}>
        <div class="table-wrapper" onMouseMove={handleTableMouseMove} onMouseLeave={handleTableMouseLeave}>
          <table class="logs-table">
            <thead>
              <tr>
                <Show when={metaError()} fallback={
                  <For each={columns()}>
                    {(col) => <th>{col}</th>}
                  </For>
                }>
                  <th colspan="100%" class="meta-error">{metaError()}</th>
                </Show>
              </tr>
            </thead>
            <tbody>
              <For each={rows()}>
                {(row) => (
                  <tr>
                    <For each={columns()}>
                      {(col) => {
                        if (col === "created_at")
                          return <td class="nowrap">{formatDate(row.created_at)}</td>;
                        if (col === "method")
                          return <td><span class="method-badge">{row.method}</span></td>;
                        if (col === "code")
                          return <td><span class={`code-badge ${getCodeClass(row.code)}`}>{row.code}</span></td>;
                        if (col === "type")
                          return <td><span class={`type-badge ${getTypeClass(row.type)}`}>{row.type}</span></td>;
                        if (col === "route")
                          return <td class="route-cell">{row.route}</td>;
                        if (col === "ip")
                          return <td class="ip-cell">{row.ip}</td>;
                        if (col === "description")
                          return <td class="description-cell">{row.description || "-"}</td>;
                        return <td>{row[col] ?? "-"}</td>;
                      }}
                    </For>
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

      <Show when={!loading() && rows().length === 0 && !error()}>
        <p class="no-logs">No data found</p>
      </Show>

      <Show when={tooltip().visible}>
        <div
          class="td-tooltip"
          style={{ left: `${tooltip().x + 14}px`, top: `${tooltip().y + 14}px` }}
        >
          {tooltip().text}
        </div>
      </Show>
    </div>
  );
}

function LogsPage(props) {
  const [resources, setResources] = createSignal([]);
  const [activeTab, setActiveTab] = createSignal(0);
  const [apiLoading, setApiLoading] = createSignal(true);
  const [apiError, setApiError] = createSignal("");

  onMount(async () => {
    try {
      const res = await fetch(`${API_BASE}/v1`, { credentials: "include" });
      if (res.status === 401) {
        props.onSessionExpired?.();
        return;
      }
      if (!res.ok) throw new Error("Failed to load API resources");
      const data = await res.json();
      setResources(data.resources || []);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setApiLoading(false);
    }
  });

  return (
    <div class="logs-container">
      <div class="logs-header">
        <h1>Logs</h1>
      </div>

      <Show when={apiError()}>
        <p class="error-message">{apiError()}</p>
      </Show>

      <Show when={apiLoading()}>
        <p class="loading-text">Loading resources...</p>
      </Show>

      <Show when={resources().length > 0}>
        <div class="resource-tabs">
          <For each={resources()}>
            {(resource, i) => (
              <button
                class={`tab-btn${activeTab() === i() ? " tab-btn-active" : ""}`}
                onClick={() => setActiveTab(i())}
              >
                {resource.name}
              </button>
            )}
          </For>
        </div>

        <For each={resources()}>
          {(resource, i) => (
            <Show when={activeTab() === i()}>
              <ResourceTable
                resource={resource}
                onSessionExpired={props.onSessionExpired}
              />
            </Show>
          )}
        </For>
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
