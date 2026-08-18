# Kanban

Nx workspace containing a Next.js dashboard and a NestJS REST API backed by PostgreSQL, Redis, and private MinIO object storage.

## Backend quick start

1. Review the separate local environment files:

   - `packages/kanban-api/.env` for NestJS and its Docker infrastructure.
   - `packages/kanban-dashboard/.env.local` for Next.js.

2. Start PostgreSQL, Redis, and MinIO:

   ```sh
   pnpm infra:up
   ```

3. Apply the TypeORM migration:

   ```sh
   pnpm db:migrate
   ```

4. Start the NestJS API:

   ```sh
   pnpm api:serve
   ```

The API is available at `http://localhost:3001/api`; Swagger is available at `http://localhost:3001/api/docs` in non-production environments. MinIO's local console is available at `http://localhost:9001`.

Build and verify with `pnpm api:build`, `pnpm api:typecheck`, `pnpm api:lint`, `pnpm api:test`, and `pnpm api:e2e`. Inspect migrations with `pnpm db:status`, run one cleanup-outbox batch with `pnpm storage:cleanup`, and stop infrastructure with `pnpm infra:down`. PostgreSQL, Redis, and MinIO data remain in named Docker volumes.

The repository-root `bruno/` collection provides a repeatable local API workflow for Auth, Users, Boards, Columns, and Tasks. With the infrastructure and API running, execute it with `pnpm bruno:test`; see `bruno/README.md` for environment and secret configuration.

Promote an existing registered account to global system administrator with:

```sh
pnpm admin:promote -- --email admin@example.com
```

## API behavior

- All endpoints except registration, login, health, and development Swagger require `Authorization: Bearer <token>`.
- Access tokens expire after 15 minutes by default. Registration and login return an opaque refresh token; rotate it through `POST /api/auth/refresh`, revoke one session through `POST /api/auth/logout`, or revoke all user sessions through `POST /api/auth/logout-all`.
- New boards contain Todo, In Progress, and Done columns.
- Reorder payloads contain every ID in the target collection exactly once.
- Attachments accept PDF, JPEG, PNG, GIF, WebP, and plain-text files up to 10 MB and are streamed only after ownership authorization.
- `/api/health/live` reports process liveness; `/api/health/ready` and the backward-compatible `/api/health` verify PostgreSQL, Redis, MinIO, and the cleanup worker.
- Object deletion is recorded transactionally and retried by the storage-cleanup outbox worker.
- Global `ADMIN` controls `/api/admin/users` account-management routes but receives no implicit board access.
- Boards use an implicit `OWNER` and stored `ADMIN`, `MEMBER`, or `VIEWER` memberships. Accessible board list/detail responses include the caller's effective `role`; task responses include nullable `assigneeId`.
- Owners manage all memberships and ownership transfers. Board admins manage settings, columns, tasks, attachments, and non-admin memberships; members manage tasks and attachments; viewers have read-only access.

## Generated workspace notes

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

✨ Your new, shiny [Nx workspace](https://nx.dev) is ready ✨.

[Learn more about this workspace setup and its capabilities](https://nx.dev/getting-started/intro#learn-nx?utm_source=nx_project&amp;utm_medium=readme&amp;utm_campaign=nx_projects) or run `npx nx graph` to visually explore what was created. Now, let's get you up to speed!

## Run tasks

To run tasks with Nx use:

```sh
npx nx <target> <project-name>
```

For example:

```sh
npx nx build myproject
```

These targets are either [inferred automatically](https://nx.dev/concepts/inferred-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or defined in the `project.json` or `package.json` files.

[More about running tasks in the docs &raquo;](https://nx.dev/features/run-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Add new projects

While you could add new projects to your workspace manually, you might want to leverage [Nx plugins](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) and their [code generation](https://nx.dev/features/generate-code?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) feature.

To install a new plugin you can use the `nx add` command. Here's an example of adding the React plugin:
```sh
npx nx add @nx/react
```

Use the plugin's generator to create new projects. For example, to create a new React app or library:

```sh
# Generate an app
npx nx g @nx/react:app demo

# Generate a library
npx nx g @nx/react:lib some-lib
```

You can use `npx nx list` to get a list of installed plugins. Then, run `npx nx list <plugin-name>` to learn about more specific capabilities of a particular plugin. Alternatively, [install Nx Console](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) to browse plugins and generators in your IDE.

[Learn more about Nx plugins &raquo;](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) | [Browse the plugin registry &raquo;](https://nx.dev/plugin-registry?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Set up CI!

### Step 1

To connect to Nx Cloud, run the following command:

```sh
npx nx connect
```

Connecting to Nx Cloud ensures a [fast and scalable CI](https://nx.dev/ci/intro/why-nx-cloud?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) pipeline. It includes features such as:

- [Remote caching](https://nx.dev/ci/features/remote-cache?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task distribution across multiple machines](https://nx.dev/ci/features/distribute-task-execution?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Automated e2e test splitting](https://nx.dev/ci/features/split-e2e-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task flakiness detection and rerunning](https://nx.dev/ci/features/flaky-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

### Step 2

Use the following command to configure a CI workflow for your workspace:

```sh
npx nx g ci-workflow
```

[Learn more about Nx on CI](https://nx.dev/ci/intro/ci-with-nx#ready-get-started-with-your-provider?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Install Nx Console

Nx Console is an editor extension that enriches your developer experience. It lets you run tasks, generate code, and improves code autocompletion in your IDE. It is available for VSCode and IntelliJ.

[Install Nx Console &raquo;](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Useful links

Learn more:

- [Learn more about this workspace setup](https://nx.dev/getting-started/intro#learn-nx?utm_source=nx_project&amp;utm_medium=readme&amp;utm_campaign=nx_projects)
- [Learn about Nx on CI](https://nx.dev/ci/intro/ci-with-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Releasing Packages with Nx release](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [What are Nx plugins?](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

And join the Nx community:
- [Discord](https://go.nx.dev/community)
- [Follow us on X](https://twitter.com/nxdevtools) or [LinkedIn](https://www.linkedin.com/company/nrwl)
- [Our Youtube channel](https://www.youtube.com/@nxdevtools)
- [Our blog](https://nx.dev/blog?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
