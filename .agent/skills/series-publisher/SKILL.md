---
name: Series_Publisher
description: Automate the publication of multi-part article series with cross-linking and chronological feed ordering.
---

# Series Publisher Skill

Use this skill when the user wants to publish a series of articles/pages that need internal cross-linking (Next/Previous parts) and must appear in a specific order (Chronological) in the community feed.

**Triggers**: 
- "Publish this article series"
- "Batch publish these pages"
- "Export multiple pages with links"
- "Handle cross-linking for this series"

## Workflow: The Two-Pass Strategy

To ensure a series appears correctly (Part 1 first, then Part 2, etc.) in the chronological community feed while maintaining valid internal links, follow this two-pass strategy.

### 1. Preparation & ID Harvesting (Pass One)
1. **Sort & Publish**: Identify all articles in the series. Sort them in **Reverse Chronological Order** (e.g., Part 3, then Part 2, then Part 1).
2. **First-Pass Publish**: Publish each article without the cross-links yet.
3. **ID Harvesting**: Capture the generated Firestore IDs for every article in the series.
   - Example: `Part_1_ID`, `Part_2_ID`, `Part_3_ID`.

### 2. Cross-Linking & Final Sync (Pass Two)
1. **Link Insertion**: Update the content of each article to include the internal links using the harvested IDs.
   - In Part 1: `[Next Part](/community/post/Part_2_ID)`
   - In Part 2: `[Previous Part](/community/post/Part_1_ID)` | `[Next Part](/community/post/Part_3_ID)`
   - In Part 3: `[Previous Part](/community/post/Part_2_ID)`
2. **Batch Update**: Run a batch update to push these changes to Firestore.

### 3. Verification
1. **Feed Order**: Verify that Part 1 is at the top (if published last in the sequence).
2. **Link Fidelity**: Verify that clicking "Next Part" navigates correctly using the SPA handler (no page reload).

## Technical Implementation Notes

- **Timestamp Management**: The community feed sorts by `createdAt` descending. To show Part 1 -> Part 2 -> Part 3 in the UI, Part 1 must have the NEWEST timestamp. 
- **SPA Navigation**: Ensure links use the internal format `/community/post/[ID]` to trigger the `navigate()` utility in `CommunityPostPage`.
- **Error Handling**: If a publish fails mid-way, rollback or flag the incomplete series to avoid broken links.

## Example Command
> "I have 5 articles for the 'Advanced React' series. Use the Series Publisher skill to get them on the community feed correctly cross-linked."
