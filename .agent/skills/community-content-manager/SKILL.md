---
name: community-content-manager
description: Manage, organize, and publish technical content to the CareerVivid community. Smartly categorizes articles, case studies, interviews, and guides into `community-content/`. Triggers on phrases like "publish to community", "organize articles", or "add case study".
---

# Community Content Manager

## Purpose
Intelligently manage the `community-content/` directory and publish high-quality technical content to the CareerVivid platform using the `cv` CLI.

## When to Use
- Propose a new post after completing a significant feature or fixing a complex bug.
- Organize existing or new Markdown files into the correct sub-folders.
- Publish drafted content to the live community feed.

## Directory Structure
- `community-content/articles/`: General technical writeups and deep dives.
- `community-content/case-studies/`: Problem-solving narratives and performance optimizations.
- `community-content/interviews/`: Interview preparation materials and candidate stories.
- `community-content/guides/`: Step-by-step tutorials and technical explainers.

## Helper Scripts
### `organize_content.mjs`
Automates categorization based on filename and content analysis.
```bash
node .agent/skills/community-content-manager/scripts/organize_content.mjs organize path/to/file.md
```

## Publishing Workflow
1. **Draft**: Create the `.md` file in the appropriate `community-content/` subfolder.
2. **Review**: Ensure no sensitive information (API keys, etc.) is included.
3. **Publish**: Use the `cv` CLI to push to the community.
   ```bash
   cv publish community-content/category/file.md --tags "tag1,tag2"
   ```

## Best Practices
- **Mermaid Diagrams**: Always include a Mermaid diagram for architecture or process flows.
- **Dry Run**: Use `cv publish --dry-run` to validate before going live.
- **JSON Output**: Use `cv publish --json` when automating from an agent flow.
