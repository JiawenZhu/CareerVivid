# Deep Dive: Maps, Heaps, and Lazy Deletion

When designing systems for billions of products, choosing the right data structures is the difference between a system that scales and one that crashes.

## 1. The Map: High-Speed Indexing
In our [Product Inventory](https://careervivid.app/community/post/dLuXj8vsWIQRZmfjk8I0), the **Map** acts as the definitive Librarian.
- **Role**: Maps `timestamp` to `price`.
- **Complexity**: $O(1)$ for insertion and deletion.
- **Why it's used**: It provides the "Truth." We can instantly verify if an order still exists and what its current price is.

## 2. The Heap: Priority Optimization
The **Min-Heap** is the efficient "Suggestion Box."
- **Role**: Keeps the lowest price at the very top.
- **Complexity**: $O(\log N)$ for pushing an order. $O(1)$ for looking at the minimum.
- **Why it's used**: Finding the minimum price in a standard array or map is $O(N)$. A heap reduces this to $O(1)$.

## 3. The "Lazy Deletion" Pattern
Wait... if Heaps are $O(1)$ for reading, why don't they handle deletions well?
- **The Problem**: Standard Binary Heaps require $O(N)$ to find and remove an arbitrary element (non-minimum).
- **The Solution**: **Lazy Deletion**. 
    - Don't delete from the heap.
    - Only delete from the Map ($O(1)$).
    - When reading the minimum, if the heap suggests an item that is no longer in the Map, discard it.

---

## Performance Summary
| Operation | Complexity | Efficiency Target |
| :--- | :--- | :--- |
| **Submit Order** | $O(\log N)$ | Fast writes. |
| **Remove Order** | $O(1)$ | Instant cancellation. |
| **Get Min Price** | $O(1)$ avg | Minimal read-latency. |

---

## Navigation
- [Return to Series Overview](https://careervivid.app/community/post/X4A3G6x1Z2bv2KjlOtSh)
- [Next: The "Reality Check" Logic](https://careervivid.app/community/post/UIBIdOSsfSN3D4j3sbOl)
