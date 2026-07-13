App workspace sidebar — white, #ececf4 right border, 36px items, soft-purple active state (#eef0ff bg, #625bd5 text, #dfe2ff border), purple credit meter at bottom.

```jsx
<Sidebar
  items={[{ section: 'Workspace' }, { id: 'home', label: 'Dashboard', icon: 'home' }, { id: 'pipeline', label: 'Career Pipeline', icon: 'kanban-square', badge: '12' }]}
  activeId="pipeline"
  credits={{ used: 34, total: 100 }}
/>
```
