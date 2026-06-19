interface GrafanaOptions {
  host?: string;
  json?: boolean;
  searchString?: string;
}

export function grafanaExpr(
  query: Record<string, string>,
  options: GrafanaOptions = {},
): string {
  const { json, searchString = "" } = options;
  let q = `{${Object.entries(query)
    .map(([key, value]) => `${key}="${value}"`)
    .join(", ")}} |= \`${searchString}\``;
  if (json) {
    q = `${q} | json`;
  }
  return q;
}

export function grafanaExploreURL(
  query: Record<string, string>,
  options: GrafanaOptions = {},
): string {
  const { host = "gearboxreth.grafana.net" } = options;
  const url = new URL(`https://${host}/explore`);
  url.searchParams.append("schemaVersion", "1");
  url.searchParams.append(
    "panes",
    JSON.stringify({
      pc8: {
        datasource: "grafanacloud-logs",
        queries: [
          {
            datasource: {
              type: "loki",
              uid: "grafanacloud-logs",
            },
            editorMode: "builder",
            expr: grafanaExpr(query, options),
            queryType: "range",
            refId: "A",
          },
        ],
        range: {
          from: "now-6h",
          to: "now",
        },
      },
    }),
  );
  url.searchParams.append("orgId", "1");
  return url.toString();
}
