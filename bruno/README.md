# Kanban API Bruno collection

This collection exercises the local NestJS API as an ordered workflow. It creates or reuses the `bruno-test@example.com` fixture user, creates a temporary board, captures tokens and resource IDs as runtime variables, validates the responses, removes the board data, and revokes the refresh session. The test user remains because the public API intentionally has no account-deletion endpoint.

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

## Runtime authentication and remote environments

The collection does not read values from `.env`. Paste an access token into the selected Bruno environment's `AuthKey` field; every protected request sends that exact value as `Authorization: Bearer {{AuthKey}}`. Login clears any stale runtime `AuthKey` override so Bruno resolves it from the selected environment, then stores only its refresh token in memory for the final logout request.

Staging and production URLs are intentionally blank. Configure `HostUrl` locally in Bruno before using those environments. The root `bruno:test` command always selects `local` and must not be used against shared environments because it performs mutations.
