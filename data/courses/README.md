# Courses

One JSON file per course, conforming to `CourseDefinition` in `src/types/course.ts`. Files are auto-discovered (`import.meta.glob`) and sorted by the `order` field — the filename prefix is just a convention for humans.

## Adding a course

1. Copy an existing file (e.g. `01-ai-foundations-map.json`).
2. Set a new unique `id` (url-safe: letters, digits, `-`, `_`, `.`) and the next `order`.
3. Fill in `title`, `tagline`, `description`, `category`, `difficulty`, `language`.
4. Add chapters and exercises. Exercise `kind` is `"code"` (default) or `"whiteboard"`.
5. Keep `status: "draft"` while writing; switch to `"published"` to make it live. `"archived"` hides a course without deleting it.

No code changes are needed. In dev mode the loader validates every file and logs warnings for authoring mistakes (missing fields, duplicate exercise ids, wrong check type for the kind).

## Check types

| check.type | Use with | Passes when |
|---|---|---|
| `run` | code | code runs without error |
| `output` | code | console output matches `expected` (`match`: `exact` or `includes`) |
| `tests` | code | all `tests` cases pass against `functionName` |
| `diagram` | whiteboard | AI grader score ≥ `passThreshold` |

## Progress

User progress is stored per course at `users/{uid}/courseProgress/{courseId}` (`CourseProgressDoc`), keyed by exercise ids — nothing to change there when adding courses.

## Firestore

The JSON shape is Firestore-safe (no arrays directly nested in arrays), so each file can be uploaded as-is to a `courses/{id}` document later if courses need to be editable without a deploy. Bump `schemaVersion` (see `COURSE_SCHEMA_VERSION`) on breaking shape changes.
