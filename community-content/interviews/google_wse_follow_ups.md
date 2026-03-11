# Interview Follow-up Solutions

This document addresses the advanced follow-up questions often asked during a Google WSE interview regarding the Product Inventory System.

## 1. What if multiple orders have the same price?
In our [ProductInventory.ts](../../src/utils/ProductInventory.ts) implementation, we store entries in the Min-Heap as `{ price, timestamp }`.
- **Logic**: Even if the price is identical (e.g., $100), the `timestamp` is unique. 
- **Effect**: If Order A ($100, t=1) is removed, Order B ($100, t=2) remains safely in the Map and the Heap. The system will correctly return 100 as the minimum.

## 2. What if the same timestamp is updated?
If a seller updates an existing order (Timestamp `5`) from $100 to $80:
1.  **Map Update**: `orders.set(5, 80)`.
2.  **Heap Insertion**: Push `{ price: 80, timestamp: 5 }` to the heap.
3.  **Lazy Cleanup**: The old entry `{ price: 100, timestamp: 5 }` is still in the heap, but it will be ignored during the **[Reality Check](https://careervivid.app/community/post/aRfbfYqPuN7qZ2MAFpeU)** because the Map now says the price for timestamp 5 is 80.

## 3. How do you handle this in a Distributed System?
At Google-scale, a single machine's memory isn't enough. We move the logic to a distributed store like **Redis**.

- **Implementation**: use **Redis Sorted Sets (ZSET)**.
    - `ZADD` to add/update orders ($O(\log N)$).
    - `ZRANGE` to get the minimum price ($O(1)$).
    - `ZREM` to remove orders ($O(\log N)$).
- **Sharding**: shard by `ProductID` across different Redis clusters to ensure high throughput and availability.

---

## Navigation
- [Return to Series Overview](https://careervivid.app/community/post/X4A3G6x1Z2bv2KjlOtSh)
- [Back: The Challenge](https://careervivid.app/community/post/dLuXj8vsWIQRZmfjk8I0)
