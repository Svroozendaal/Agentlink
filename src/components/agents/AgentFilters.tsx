import type { PricingModel } from "@/types/agent";

interface AgentFiltersProps {
  actionPath?: string;
  query: {
    q?: string;
    skills?: string[];
    protocols?: string[];
    endpointTypes?: string[];
    category?: string;
    pricing?: PricingModel;
    verified?: boolean;
    playground?: boolean;
    connect?: boolean;
    sort: "relevance" | "rating" | "newest" | "name";
    limit: number;
  };
  options: {
    skills: string[];
    protocols: string[];
    categories: string[];
    endpointTypes: string[];
  };
}

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "rating", label: "Highest rated" },
  { value: "newest", label: "Newest" },
  { value: "name", label: "Name (A-Z)" },
] as const;

const PRICING_OPTIONS: Array<{ value: PricingModel; label: string }> = [
  { value: "FREE", label: "Free" },
  { value: "FREEMIUM", label: "Freemium" },
  { value: "PAID", label: "Paid" },
  { value: "ENTERPRISE", label: "Enterprise" },
];

function buildResetHref(actionPath: string, query: AgentFiltersProps["query"]): string {
  const params = new URLSearchParams();

  if (query.q) {
    params.set("q", query.q);
  }

  if (query.limit !== 12) {
    params.set("limit", String(query.limit));
  }

  const search = params.toString();
  return search.length > 0 ? `${actionPath}?${search}` : actionPath;
}

function FilterForm({
  actionPath,
  query,
  options,
  idPrefix,
}: {
  actionPath: string;
  query: AgentFiltersProps["query"];
  options: AgentFiltersProps["options"];
  idPrefix: string;
}) {
  const resetHref = buildResetHref(actionPath, query);

  return (
    <form action={actionPath} method="get" className="space-y-5">
      {query.q ? <input type="hidden" name="q" value={query.q} /> : null}
      <input type="hidden" name="limit" value={query.limit} />
      <input type="hidden" name="page" value="1" />

      <div>
        <label htmlFor={`${idPrefix}-sort`} className="mb-2 block text-sm font-semibold text-zinc-800">
          Sort by
        </label>
        <select
          id={`${idPrefix}-sort`}
          name="sort"
          defaultValue={query.sort}
          className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor={`${idPrefix}-category`}
          className="mb-2 block text-sm font-semibold text-zinc-800"
        >
          Category
        </label>
        <select
          id={`${idPrefix}-category`}
          name="category"
          defaultValue={query.category ?? ""}
          className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm"
        >
          <option value="">All categories</option>
          {options.categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor={`${idPrefix}-pricing`}
          className="mb-2 block text-sm font-semibold text-zinc-800"
        >
          Pricing
        </label>
        <select
          id={`${idPrefix}-pricing`}
          name="pricing"
          defaultValue={query.pricing ?? ""}
          className="h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm"
        >
          <option value="">All models</option>
          {PRICING_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold text-zinc-800">Quality</legend>
        <label className="mt-2 flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            name="verified"
            value="true"
            defaultChecked={query.verified === true}
            className="h-4 w-4 rounded border-zinc-300"
          />
          Verified agents only
        </label>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-zinc-800">Capabilities</legend>
        <label className="mt-2 flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            name="playground"
            value="true"
            defaultChecked={query.playground === true}
            className="h-4 w-4 rounded border-zinc-300"
          />
          Playground available
        </label>
        <label className="mt-2 flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            name="connect"
            value="true"
            defaultChecked={query.connect === true}
            className="h-4 w-4 rounded border-zinc-300"
          />
          Connect available
        </label>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-zinc-800">Skills</legend>
        <div className="mt-2 max-h-56 space-y-2 overflow-y-auto pr-2">
          {options.skills.length === 0 ? (
            <p className="text-sm text-zinc-500">No skill filters available yet.</p>
          ) : (
            options.skills.map((skill) => (
              <label key={skill} className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  name="skills"
                  value={skill}
                  defaultChecked={query.skills?.includes(skill)}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                {skill}
              </label>
            ))
          )}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-zinc-800">Protocols</legend>
        <div className="mt-2 space-y-2">
          {options.protocols.length === 0 ? (
            <p className="text-sm text-zinc-500">No protocol filters available yet.</p>
          ) : (
            options.protocols.map((protocol) => (
              <label key={protocol} className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  name="protocols"
                  value={protocol}
                  defaultChecked={query.protocols?.includes(protocol)}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                {protocol.toUpperCase()}
              </label>
            ))
          )}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-zinc-800">Endpoint types</legend>
        <div className="mt-2 space-y-2">
          {options.endpointTypes.length === 0 ? (
            <p className="text-sm text-zinc-500">No endpoint type filters available yet.</p>
          ) : (
            options.endpointTypes.map((endpointType) => (
              <label key={endpointType} className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  name="endpointTypes"
                  value={endpointType}
                  defaultChecked={query.endpointTypes?.includes(endpointType)}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                {endpointType}
              </label>
            ))
          )}
        </div>
      </fieldset>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="h-10 rounded-lg bg-sky-700 px-4 text-sm font-semibold text-white transition hover:bg-sky-800"
        >
          Apply filters
        </button>
        <a href={resetHref} className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
          Reset
        </a>
      </div>
    </form>
  );
}

export function AgentFilters({ actionPath = "/agents", query, options }: AgentFiltersProps) {
  return (
    <>
      <details className="rounded-2xl border border-zinc-200 bg-white p-4 md:hidden">
        <summary className="cursor-pointer text-sm font-semibold text-zinc-900">Filters</summary>
        <div className="mt-4">
          <FilterForm actionPath={actionPath} query={query} options={options} idPrefix="mobile" />
        </div>
      </details>

      <aside className="hidden rounded-2xl border border-zinc-200 bg-white p-5 md:block">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">Filters</h2>
        <FilterForm actionPath={actionPath} query={query} options={options} idPrefix="desktop" />
      </aside>
    </>
  );
}
