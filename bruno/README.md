# Kanban API Bruno collection

This collection exercises the local NestJS API as an ordered workflow. It creates a unique user and temporary board, captures tokens and resource IDs as runtime variables, validates the responses, removes the board data, and revokes the refresh session. The test user remains because the public API intentionally has no account-deletion endpoint.

## Run locally

From the repository root:

```sh
pnpm infra:up
pnpm db:migrate
pnpm api:serve
```

In another terminal:

```sh
pnpm bruno:test
```

You can also open the `bruno/` directory in the Bruno desktop app and select the `local` environment. Requests use `{{HostUrl}}` and authenticated requests send `Authorization: Bearer {{AuthKey}}`.

## Secrets and remote environments

Copy `.env.example` to `.env` only when you need a fallback access token for running an individual request. The generated workflow token remains an in-memory runtime variable and is not written to disk. The `.env` file is ignored by Git.

Staging and production URLs are intentionally blank. Configure `HostUrl` locally in Bruno before using those environments. The root `bruno:test` command always selects `local` and must not be used against shared environments because it performs mutations.
