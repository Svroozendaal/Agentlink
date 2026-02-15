interface AgentSearchBarProps {
  actionPath?: string;
  initialQuery?: string;
  preservedParams?: Record<string, string | string[] | undefined>;
  buttonLabel?: string;
  placeholder?: string;
}

function renderHiddenField(name: string, value: string | string[]) {
  if (Array.isArray(value)) {
    return value.map((entry, index) => (
      <input key={`${name}-${index}`} type="hidden" name={name} value={entry} />
    ));
  }

  return <input key={name} type="hidden" name={name} value={value} />;
}

export function AgentSearchBar({
  actionPath = "/agents",
  initialQuery,
  preservedParams = {},
  buttonLabel = "Search",
  placeholder = "Search by agent name, description, or use case...",
}: AgentSearchBarProps) {
  return (
    <form action={actionPath} method="get" className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
      {Object.entries(preservedParams).map(([key, value]) => {
        if (!value || key === "q" || key === "page") {
          return null;
        }

        return renderHiddenField(key, value);
      })}
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          name="q"
          defaultValue={initialQuery}
          placeholder={placeholder}
          className="h-11 w-full rounded-xl border border-zinc-300 px-4 text-sm text-zinc-900 outline-none ring-0 transition focus:border-sky-500"
        />
        <button
          type="submit"
          className="h-11 rounded-xl bg-sky-700 px-6 text-sm font-semibold text-white transition hover:bg-sky-800"
        >
          {buttonLabel}
        </button>
      </div>
    </form>
  );
}
