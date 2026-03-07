# `cv publish`

Publish articles or diagrams to your CareerVivid portfolio.

## Usage

```bash
cv publish <file> [options]
cv publish -       (read from stdin)
```

## Options

| Option | Description |
|---|---|
| `-t, --title <title>` | Post title |
| `--type <type>` | `article` \| `whiteboard` |
| `--format <format>` | `markdown` \| `mermaid` |
| `--tags <tags>` | Comma-separated tags |
| `--cover <url>` | Cover image URL |
| `--dry-run` | Validate without publishing |
| `--json` | Machine-readable JSON output |

## Examples

```bash
# Basic publish
cv publish article.md

# Publish with tags
cv publish article.md --tags "node,typescript"

# Pipe from AI agent
cat writeup.md | cv publish - --json
```
