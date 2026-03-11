# The "Reality Check" Logic

How does the system ensure the minimum price suggested by the heap is actually valid? We call this the **Reality Check**.

## The Implementation

In the `getMinPrice()` method, the code performs a verification step against the Map before returning a result:

```typescript
while (this.minHeap.length > 0) {
  const top = this.minHeap[0]; // Peek at the heap's smallest item

  // The "Reality Check"
  // 1. Does the timestamp exist in the Map?
  // 2. Does the price in the Map match the price in the Heap?
  if (this.orders.has(top.timestamp) && this.orders.get(top.timestamp) === top.price) {
    return top.price; // Verified Truth.
  }

  // If the check fails, the item is 'Stale' or 'Deleted'
  this.heapPop(); // Evict and check the next one.
}
```

## Why this is highly efficient

1.  **Deletions are Instant**: When `removeOrder(t)` is called, we only delete from the Map ($O(1)$). We don't touch the heap.
2.  **Delayed Costs**: We only spend time cleaning the heap when someone actually wants to read the minimum price.
3.  **Irrelevant Garbage**: If a deleted item is deep inside the heap, it never reaches the top and never triggers a Reality Check. It stays "buried" until it no longer matters.

---

## Navigation
- [Return to Series Overview](https://careervivid.app/community/post/X4A3G6x1Z2bv2KjlOtSh)
- [Next: Interview Follow-up Solutions](https://careervivid.app/community/post/Em49sZ6PGfHGofhlTrss)
