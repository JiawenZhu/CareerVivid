# `cv auth`

Management for CareerVivid API keys.

## Commands

### `cv auth set-key`
Save an API key to your local machine.

```bash
cv auth set-key <key>
```

### `cv auth check`
Verify if the current key is valid.

```bash
cv auth check
```

### `cv auth whoami`
Show the currently authenticated user.

```bash
cv auth whoami
```

### `cv auth remove`
Clear the saved session.

```bash
cv auth remove
```

> [!NOTE]
> Keys are stored securely in `~/.careervividrc.json`.
