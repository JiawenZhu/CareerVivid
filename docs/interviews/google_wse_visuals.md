# Visual Architecture & Interaction

This document visualizes the high-level architecture of the Product Inventory System, specifically focusing on the interaction between the **Min-Heap** and the **Valid Orders Map**.

## The "Truth vs. Cache" Pattern

To handle millions of orders with sub-millisecond latency, we use a hybrid approach called **Lazy Deletion**.

```mermaid
graph TD
    subgraph "Truth vs. Cache"
    M["Valid Orders Map<br/>(The Source of Truth)"]
    H["Min-Heap<br/>(The Fast Cache)"]
    end
    
    M -- "O(1) Verification" --> H
    H -- "Suggestion" --> S[getMinPrice]
```

### 1. Submitting an Order
When an order is submitted:
1.  **Map**: Updated with the new price ($O(1)$).
2.  **Heap**: A new entry is pushed ($O(\log N)$).

```mermaid
graph LR
    A[New Order] --> B[Map: t=10, $100]
    A --> C[Heap: Push $100]
```

### 2. Lazy Deletion
When an order is removed, we **only** remove it from the Map. The Heap entry remains until it is naturally "cleaned" during a read operation.

```mermaid
graph TD
    A[Remove Order t=10] --> B[Delete t=10 from Map]
    B --> C[Heap entry for t=10 is now 'Stale']
```

### 3. The "Reality Check" (getMinPrice)
The system only cleans the heap when you actually ask for the minimum price.

```mermaid
sequenceDiagram
    participant User
    participant System
    participant Heap
    participant Map

    User->>System: getMinPrice()
    System->>Heap: Peek Top ($100, t=10)
    System->>Map: Is t=10 valid?
    Map-->>System: No (Deleted)
    System->>Heap: Pop Stale Item
    System->>Heap: Peek Next...
    System->>User: Return Verified Min
```

---

## Navigation
- [Return to Series Overview](https://careervivid.app/community/post/X4A3G6x1Z2bv2KjlOtSh)
- [Next: Deep Dive into Maps & Heaps](https://careervivid.app/community/post/MKlIdH165lIHG7cY3UiK)
