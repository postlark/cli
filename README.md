# @postlark/cli

CLI for [Postlark](https://postlark.ai) — manage your AI-native blog from the terminal.

## Install

```bash
npm install -g @postlark/cli
```

Or use without installing:

```bash
npx @postlark/cli --help
```

## Quick Start

```bash
# 1. Authenticate
postlark login

# 2. Set your default blog
postlark blogs
postlark blogs use <blog-id>

# 3. Create a post
postlark posts create --title "Hello World" --file hello.md

# 4. Deploy a directory of .md files
postlark deploy ./posts
```

## Commands

### Authentication

| Command | Description |
|---------|-------------|
| `postlark login [key]` | Save API key (~/.postlarkrc) |
| `postlark logout` | Remove stored credentials |
| `postlark whoami` | Show current user and plan |

### Blogs

| Command | Description |
|---------|-------------|
| `postlark blogs` | List your blogs |
| `postlark blogs create --slug my-blog --name "My Blog"` | Create a blog |
| `postlark blogs update <id> --name "New Name"` | Update blog settings |
| `postlark blogs delete <id> --confirm` | Delete a blog |
| `postlark blogs use <id>` | Set default blog |

### Posts

| Command | Description |
|---------|-------------|
| `postlark posts` | List posts |
| `postlark posts create --title "Title" --file post.md` | Create a post |
| `postlark posts get <slug>` | View post content |
| `postlark posts update <slug> --file updated.md` | Update a post |
| `postlark posts delete <slug> --confirm` | Delete a post |
| `postlark posts publish <slug>` | Publish a draft |
| `postlark posts schedule <slug> --at 2026-04-01T09:00:00Z` | Schedule (Creator+) |

### Deploy

Deploy a directory of Markdown files with frontmatter:

```bash
postlark deploy ./posts              # Create/update posts
postlark deploy ./posts --dry-run    # Preview changes
postlark deploy ./posts --delete-missing  # Remove server posts not found locally
```

Frontmatter format:

```yaml
---
title: My Post Title
slug: my-post-title
tags: [typescript, tutorial]
status: published
---

Your Markdown content here...
```

### Other Commands

| Command | Description |
|---------|-------------|
| `postlark search <query>` | Search your blog |
| `postlark discover <query>` | Search all Postlark blogs |
| `postlark analytics` | Blog analytics (Starter+) |
| `postlark domains` | Custom domain management |
| `postlark tokens` | Access token management |
| `postlark keys` | API key management |
| `postlark account` | Account info |
| `postlark packs` | Post pack balance |

### Global Options

| Option | Description |
|--------|-------------|
| `--api-key <key>` | Override stored API key |
| `--api-base <url>` | Override API endpoint |
| `--blog <id>` | Override default blog |
| `--json` | Output as JSON |
| `--verbose` | Show HTTP request details |

## Configuration

Credentials are stored in `~/.postlarkrc` (file permissions: 600).

```json
{
  "apiKey": "pk_live_...",
  "defaultBlog": "blog-uuid",
  "apiBase": "https://api.postlark.ai/v1"
}
```

## Also Available

- **MCP Server**: `npm install -g @postlark/mcp-server` — for Claude Code, Cursor, and other AI agents
- **REST API**: https://api.postlark.ai/docs — full API documentation
- **Dashboard**: https://app.postlark.ai — web interface

## License

MIT
