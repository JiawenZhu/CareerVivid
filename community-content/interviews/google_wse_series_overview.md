# Google WSE Interview Series: Product Inventory System

Welcome to the Google Web Solution Engineer (WSE) interview series. This series breaks down a real-world Google interview question, providing a high-performance implementation and deep-dives into the underlying data structures.

## Series Breakdown

1.  **[The Challenge: Product Inventory System](https://careervivid.app/community/post/7Zv1qXIq3I5RGU5jSDcd)**
    The core problem statement, constraints, and initial logic requirements.
2.  **[Visual Architecture & Interaction](https://careervivid.app/community/post/Eli0yart3zaXGUxS44fS)**
    Mermaid diagrams illustrating how the Map and Heap work together using Lazy Deletion.
3.  **[Deep Dive: Maps, Heaps, and Lazy Deletion](https://careervivid.app/community/post/MKlIdH165lIHG7cY3UiK)**
    An in-depth look at the data structures used and why they scale to millions of orders.
4.  **[The "Reality Check" Logic](https://careervivid.app/community/post/UIBIdOSsfSN3D4j3sbOl)**
    A focused explanation of how the system validates "stale" heap entries against the Map's source of truth.
5.  **[Interview Follow-up Solutions](https://careervivid.app/community/post/Em49sZ6PGfHGofhlTrss)**
    Solutions for duplicate prices, timestamp updates, and distributed system scaling (Redis).

---

## Technical Stack
- **Language**: TypeScript
- **Testing**: Vitest
- **Patterns**: Min-Heap with Lazy Deletion, Hash Map indexing.

---

*This series is published via the [CareerVivid](https://careervivid.com) platform.*
