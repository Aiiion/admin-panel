import { createSignal, onMount, Show, For } from "solid-js";
import { API_BASE } from "../config";

export default function RequestLogsFilters(props) {
  const [availableCodes, setAvailableCodes] = createSignal([]);
  const [selectedCodes, setSelectedCodes] = createSignal([]);
  const [showDropdown, setShowDropdown] = createSignal(false);

  onMount(async () => {
    try {
      const res = await fetch(`${API_BASE}${props.resource.meta}/code`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableCodes(data.data.values || []);
      }
    } catch {
      // Code filter unavailable
    }
  });

  const handleChange = (e) => {
    const code = e.target.value;
    let updated = [...selectedCodes()];
    if (e.target.checked) {
      if (!updated.includes(code)) updated.push(code);
    } else {
      updated = updated.filter((c) => c !== code);
    }
    setSelectedCodes(updated);
    props.onChange(updated.map((c) => ["code", c]));
  };

  return (
    <Show when={availableCodes().length > 0}>
      <div class="code-filter-wrapper">
        <button
          class="filter-btn"
          onClick={() => setShowDropdown(!showDropdown())}
        >
          Codes {selectedCodes().length > 0 ? `(${selectedCodes().length})` : ""}
        </button>
        <Show when={showDropdown()}>
          <div class="code-filter-dropdown">
            <For each={availableCodes()}>
              {(code) => (
                <label>
                  <input
                    type="checkbox"
                    value={code}
                    checked={selectedCodes().includes(String(code))}
                    onChange={handleChange}
                  />{" "}
                  {code}
                </label>
              )}
            </For>
          </div>
        </Show>
      </div>
    </Show>
  );
}
