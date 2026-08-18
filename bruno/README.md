# Kanban API Bruno collection

This collection provides editable requests for the NestJS API. It deliberately does not capture or store resource IDs as Bruno variables. Copy IDs from API responses and paste them directly into request URLs or JSON bodies where `PASTE_*_HERE` appears.

## Run locally

From the repository root:

```sh
pnpm infra:up
pnpm db:migrate
pnpm api:serve
```

You can also open the `bruno/` directory in the Bruno desktop app and select the `local` environment. Requests use `{{HostUrl}}` and authenticated requests send `Authorization: Bearer {{AuthKey}}`.

## Authentication and request IDs

Only `HostUrl` and `AuthKey` are environment values. Paste an access token into the selected Bruno environment's `AuthKey` field; every protected request sends that exact value. Login never overrides it.

Board, column, and task IDs are not environment or runtime variables. Paste each ID directly into the request that needs it. The logout request similarly contains a direct `PASTE_REFRESH_TOKEN_HERE` placeholder because refresh tokens are not captured automatically.

## Give board permission

The user must already be registered. In `Members and Board Roles`:

1. Open `Add member and give permission`.
2. Paste the board ID directly into `PASTE_BOARD_ID_HERE`.
3. Enter the registered user's email directly in the JSON body.
4. Set `role` to `ADMIN`, `MEMBER`, or `VIEWER` and send the request.

Use an owner access token in environment `AuthKey` when assigning `ADMIN`. A board `ADMIN` can add `MEMBER` or `VIEWER`, but cannot assign another `ADMIN`.

To change an existing member's permission, open `Change board member role`, paste the board and user IDs directly into its URL, and set the JSON `role`. The board owner can assign every stored role; a board admin can only manage `MEMBER` and `VIEWER`.

- `OWNER`: full access, board deletion, ADMIN management, and ownership transfer.
- `ADMIN`: board/column/task/member management, except ADMIN-role and ownership operations.
- `MEMBER`: read access plus task and attachment mutations.
- `VIEWER`: read-only access.

`Transfer board ownership` accepts only an existing board `ADMIN` or `MEMBER`. Paste that user's ID directly into the body.

## Change global system role

Board roles and global system roles are separate. A global `ADMIN` does not automatically get access to boards.

For the first global admin, promote an existing account from the repository root:

```sh
pnpm admin:promote --email admin@example.com
```

Log in again or paste a valid access token for that account into environment `AuthKey`. Then use `Global Admin and System Roles`:

1. `List system users` finds the target user ID.
2. `Change global system role` takes that ID directly in its URL.
3. Set `role` to `ADMIN` or `USER` and send it.

The API rejects self-demotion. Use another global admin for demotion; the CLI remains the recovery path for promotion.

Staging and production URLs and tokens are intentionally blank. Configure them locally in Bruno and never commit real credentials. Because IDs are entered manually, run requests individually from the Bruno app instead of treating the collection as an automatic chained workflow.
