import RequestLogsFilters from "./RequestLogs";
import ErrorLogsFilters from "./ErrorLogs";

// Map resource.name (as returned by the API) to a filter component.
// Each component receives:
//   props.resource  — the full resource object ({ name, endpoint, meta })
//   props.onChange  — callback([["paramKey", "value"], ...]) called on filter change
const registry = {
  "Request Logs": RequestLogsFilters,
  "Error Logs": ErrorLogsFilters,
};

export function getFiltersComponent(resourceName) {
  return registry[resourceName] ?? null;
}
