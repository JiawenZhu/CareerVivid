import { describe, it, expect } from 'vitest';
import { ProductInventory } from './ProductInventory';

describe('ProductInventory', () => {
    it('should return null when empty', () => {
        const inventory = new ProductInventory();
        expect(inventory.getMinPrice()).toBeNull();
    });

    it('should track minimum price as orders are submitted', () => {
        const inventory = new ProductInventory();
        inventory.submitOrder(100, 1);
        expect(inventory.getMinPrice()).toBe(100);

        inventory.submitOrder(50, 2);
        expect(inventory.getMinPrice()).toBe(50);

        inventory.submitOrder(75, 3);
        expect(inventory.getMinPrice()).toBe(50);
    });

    it('should handle removing the current minimum', () => {
        const inventory = new ProductInventory();
        inventory.submitOrder(100, 1);
        inventory.submitOrder(50, 2);
        inventory.submitOrder(75, 3);

        expect(inventory.getMinPrice()).toBe(50);

        inventory.removeOrder(2);
        expect(inventory.getMinPrice()).toBe(75);
    });

    it('should handle updates correctly (overwrite with lazy deletion)', () => {
        const inventory = new ProductInventory();
        inventory.submitOrder(100, 1);
        inventory.submitOrder(50, 2);

        expect(inventory.getMinPrice()).toBe(50);

        // Update order 2 to be $150
        inventory.submitOrder(150, 2);
        expect(inventory.getMinPrice()).toBe(100);
    });

    it('should handle multiple removals', () => {
        const inventory = new ProductInventory();
        inventory.submitOrder(10, 1);
        inventory.submitOrder(20, 2);
        inventory.submitOrder(5, 3);

        expect(inventory.getMinPrice()).toBe(5);

        inventory.removeOrder(3);
        expect(inventory.getMinPrice()).toBe(10);

        inventory.removeOrder(1);
        expect(inventory.getMinPrice()).toBe(20);

        inventory.removeOrder(2);
        expect(inventory.getMinPrice()).toBeNull();
    });

    it('should handle duplicate price submissions correctly', () => {
        const inventory = new ProductInventory();
        inventory.submitOrder(100, 1);
        inventory.submitOrder(100, 2);

        expect(inventory.getMinPrice()).toBe(100);

        inventory.removeOrder(1);
        expect(inventory.getMinPrice()).toBe(100);

        inventory.removeOrder(2);
        expect(inventory.getMinPrice()).toBeNull();
    });
});
