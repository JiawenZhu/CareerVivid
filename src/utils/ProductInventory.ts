/**
 * ProductInventory - A high-performance price tracking system.
 * Designed for Google WSE interview constraints:
 * - submitOrder(price, timestamp): O(log N)
 * - removeOrder(timestamp): O(1)
 * - getMinPrice(): O(1) average, O(K log N) with K lazy-deleted items.
 */
export class ProductInventory {
    private orders: Map<number, number>; // timestamp -> price
    private minHeap: { price: number; timestamp: number }[];

    constructor() {
        this.orders = new Map();
        this.minHeap = [];
    }

    /**
     * Submits or updates an order with a price and timestamp.
     * Implementation using Min-Heap for efficient min retrieval.
     * Time Sensitivity: O(log N) for heap insertion.
     */
    submitOrder(price: number, timestamp: number): void {
        // Note: If timestamp exists, the old entry in minHeap becomes "stale" 
        // and will be handled via lazy deletion in getMinPrice.
        this.orders.set(timestamp, price);
        this.heapPush({ price, timestamp });
    }

    /**
     * Removes an order identified by a timestamp.
     * Implementation using Lazy Deletion: Mark for deletion by removing from the Map.
     * Time Complexity: O(1).
     */
    removeOrder(timestamp: number): void {
        this.orders.delete(timestamp);
    }

    /**
     * Returns the lowest price among current orders.
     * Cleans up the top of the heap if they have been stale/removed (Lazy Deletion).
     * Time Complexity: O(1) average, O(K log N) worst case for K stale entries at top.
     */
    getMinPrice(): number | null {
        while (this.minHeap.length > 0) {
            const top = this.minHeap[0];

            // Check if this entry in heap matches the current valid price for this timestamp
            if (this.orders.has(top.timestamp) && this.orders.get(top.timestamp) === top.price) {
                return top.price;
            }

            // Otherwise, the entry is stale (price updated or order removed)
            this.heapPop();
        }

        return null;
    }

    // --- Internals: Min-Heap Helpers ---

    private heapPush(item: { price: number; timestamp: number }): void {
        this.minHeap.push(item);
        this.bubbleUp(this.minHeap.length - 1);
    }

    private heapPop(): { price: number; timestamp: number } | undefined {
        if (this.minHeap.length === 0) return undefined;
        const top = this.minHeap[0];
        const last = this.minHeap.pop()!;

        if (this.minHeap.length > 0) {
            this.minHeap[0] = last;
            this.bubbleDown(0);
        }

        return top;
    }

    private bubbleUp(index: number): void {
        while (index > 0) {
            const parent = Math.floor((index - 1) / 2);
            if (this.minHeap[parent].price <= this.minHeap[index].price) break;

            [this.minHeap[parent], this.minHeap[index]] = [this.minHeap[index], this.minHeap[parent]];
            index = parent;
        }
    }

    private bubbleDown(index: number): void {
        while (true) {
            let smallest = index;
            const left = 2 * index + 1;
            const right = 2 * index + 2;

            if (left < this.minHeap.length && this.minHeap[left].price < this.minHeap[smallest].price) {
                smallest = left;
            }
            if (right < this.minHeap.length && this.minHeap[right].price < this.minHeap[smallest].price) {
                smallest = right;
            }

            if (smallest === index) break;

            [this.minHeap[index], this.minHeap[smallest]] = [this.minHeap[smallest], this.minHeap[index]];
            index = smallest;
        }
    }
}
