# `cv config`

View and update local CLI settings.

## Commands

### `cv config show`
Print the full configuration.

```bash
cv config show
```

### `cv config get`
Retrieve a specific configuration value.

```bash
cv config get <key>
```

### `cv config set`
Update a specific configuration value.

```bash
cv config set <key> <value>
```

## Environment Variables
The CLI respects the following environment variables:

- `CV_API_KEY`: Override the saved API key.
- `CV_API_URL`: Override the publish endpoint.
