# ---- shared: install the whole workspace once ----
FROM node:24.15.0-trixie AS deps

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

COPY . .

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    corepack enable \
    && pnpm install --frozen-lockfile

# ---- shared: build every app (esbuild bundles) ----
FROM deps AS build

RUN pnpm -r build

# ---- liquidator: production node_modules (flat) + foundry ----
FROM node:24.15.0-trixie AS liquidator-prod

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/
COPY --from=build /app/apps/liquidator/package.json /app/apps/liquidator/package.json
COPY --from=build /app/apps/optimist/package.json /app/apps/optimist/package.json
COPY --from=build /app/packages/liquidator-v2-config/package.json /app/packages/liquidator-v2-config/package.json
COPY --from=build /app/apps/liquidator/build/ /app/apps/liquidator/build

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    corepack enable \
    && npm pkg delete scripts.prepare \
    && pnpm install --prod --frozen-lockfile

# The bundled entry runs from /app/index.mjs and imports the only external
# runtime dependency (node-pty, native bindings) via ESM, which resolves only
# through node_modules. pnpm hoists it privately under .pnpm, so expose it at
# the top level.
RUN ln -s /app/node_modules/.pnpm/node_modules/node-pty /app/node_modules/node-pty

# Install foundry (provides `cast` used for optimistic trace generation)
ENV FOUNDRY_DIR=/root/.foundry
RUN mkdir ${FOUNDRY_DIR} && \
    curl -L https://foundry.paradigm.xyz | bash && \
    ${FOUNDRY_DIR}/bin/foundryup

# ---- liquidator: final image ----
FROM gcr.io/distroless/nodejs24-debian13 AS liquidator
ARG PACKAGE_VERSION
ENV PACKAGE_VERSION=${PACKAGE_VERSION:-dev}
LABEL org.opencontainers.image.version="${PACKAGE_VERSION}"

WORKDIR /app
COPY --from=liquidator-prod /app/node_modules /app/node_modules
COPY --from=liquidator-prod /app/apps/liquidator/build/ /app/
COPY --from=liquidator-prod /root/.foundry/bin/cast /app
COPY --from=liquidator-prod /usr/bin/timeout /app/timeout
ENV PATH="/app:${PATH}"

ENTRYPOINT ["/nodejs/bin/node", "--enable-source-maps", "/app/index.mjs"]

# ---- optimist: final image (esbuild output is fully bundled) ----
FROM gcr.io/distroless/nodejs24-debian12 AS optimist
ARG OPTIMIST_VERSION
ARG OPTIMIST_TAG
ENV NODE_ENV=production
ENV OPTIMIST_VERSION=${OPTIMIST_VERSION:-dev}
ENV OPTIMIST_TAG=${OPTIMIST_TAG:-dev}
LABEL org.opencontainers.image.version="${OPTIMIST_VERSION}"

USER 1000:1000
WORKDIR /app
COPY --from=build /app/apps/optimist/build/ /app/

ENTRYPOINT ["/nodejs/bin/node", "--enable-source-maps", "/app/index.mjs"]
