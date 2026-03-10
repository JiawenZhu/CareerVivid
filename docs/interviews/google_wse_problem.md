# Google Interview Question: Product Inventory System

## Background
Google Shopping allows millions of sellers to list their products. To ensure a competitive marketplace, we need a high-performance system that can provide real-time insights into product pricing across the platform.

## Problem Statement
Design a class `ProductInventory` that supports the following operations for tracking product prices:

1.  **`submitOrder(price, timestamp)`**:
    *   A seller submits an order with a specific price (integer) and a unique timestamp (integer).
    *   If an order with the same timestamp already exists, it should be updated with the new price.
    
2.  **`removeOrder(timestamp)`**:
    *   Sellers can remove their order identified by a specific timestamp.
    *   If no such order exists, the operation should do nothing.

3.  **`getMinPrice()`**:
    *   Returns the lowest price among all *current* orders in the system.
    *   If no orders are present, return `null` or -1 (as per implementation choice).

## Example Case
```typescript
const inventory = new ProductInventory();

inventory.submitOrder(100, 10); // Order at t=10 is $100
inventory.submitOrder(50, 20);  // Order at t=20 is $50
inventory.getMinPrice();        // Returns 50

inventory.submitOrder(30, 15);  // Order at t=15 is $30
inventory.getMinPrice();        // Returns 30

inventory.removeOrder(20);      // Remove $50 order
inventory.getMinPrice();        // Returns 30

inventory.removeOrder(15);      // Remove $30 order
inventory.getMinPrice();        // Returns 100
```

## Constraints
*   `price` is a positive integer.
*   `timestamp` is a unique identifier (within the context of `removeOrder`).
*   The system must scale to handle **millions** of orders.
*   `getMinPrice()` should be optimized for extremely low latency.

## Interviewer Guidance (Targeting Google WSE Role)
*   **Initial thought**: Using a simple array/list for storage. `getMinPrice` becomes $O(N)$.
*   **Optimization 1**: Use a Min-Heap.
    *   *Challenge*: How to handle `removeOrder` for arbitrary timestamps? Heaps are not good at arbitrary removals ($O(N)$ seek).
*   **Optimization 2**: Min-Heap with **Lazy Deletion**.
    *   Keep a Map of `timestamp -> price`.
    *   When an order is removed, just remove it from the Map.
    *   When calling `getMinPrice`, if the top of the heap is not in the Map, pop it and check the next one.
## Follow-up Solutions

### 1. What if multiple orders have the same price?
Even if multiple orders share a price, they represent unique entries in our system. We handle this by storing a **tuple** of `{price, timestamp}` in the heap.
- **Why it works**: The `timestamp` acts as a unique discriminator. If Order A ($100, t=1) is removed, Order B ($100, t=2) remains valid in the Map and will be correctly returned as the minimum.

### 2. What if the same timestamp is updated?
Updating an order (e.g., price dropping from $100 to $80 for timestamp `10`) is handled seamlessly by the **Lazy Deletion** pattern.
- **Workflow**:
    1. Update `this.orders.set(10, 80)`.
    2. Push `{price: 80, timestamp: 10}` to the heap.
    3. The old `{price: 100, timestamp: 10}` stays in the heap but will fail the **Reality Check** (`orders.get(10) === 100` will be false because the current price is 80).

### 3. How would you handle this in a distributed system?
For a Google-scale application, a single-machine approach won't suffice. 
- **The Solution**: Use **Redis Sorted Sets (ZSET)**.
- **ZSET Mechanics**: 
    - `ZADD inventory <price> <timestamp>`: Adds/updates an entry in $O(\log N)$.
    - `ZRANGE inventory 0 0`: Retrieves the minimum price in $O(1)$.
    - `ZREM inventory <timestamp>`: Removes an entry in $O(\log N)$.
- **Sharding**: Partition data by `ProductID` across different Redis clusters to handle massive throughput.
