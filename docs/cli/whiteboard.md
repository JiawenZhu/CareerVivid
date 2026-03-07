# `cv whiteboard`

Manage Mermaid architecture diagrams directly from the terminal.

## Commands

### `cv whiteboard new`
Scaffold a new `.mmd` file from a template. (Shortcut: `cv new`)

```bash
cv new [filename] --template <template>
```

### `cv whiteboard list-templates`
View all available Mermaid templates. (Shortcut: `cv list-templates`)

```bash
cv list-templates
```

### `cv whiteboard publish`
Publish a diagram to the community feed.

```bash
cv whiteboard publish diagram.mmd --title "System Architecture"
```

## Available Templates
- `flowchart`
- `system-arch`
- `tech-stack`
- `user-journey`
- `er-diagram`
- `git-flow`
- `ci-cd`
- `mindmap`
