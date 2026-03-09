"use client";

import React from "react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/features/commerce/context/CartContext";
import { NavigationProvider } from "@/contexts/NavigationContext";
import { DndProvider } from "react-dnd";
import { MultiBackend, getBackendOptions } from "@minoru/react-dnd-treeview";

export function Providers({ children }: { children: any }) {
    const inner = (
        <ThemeProvider>
            <AuthProvider>
                <CartProvider>
                    <NavigationProvider>
                        {children}
                    </NavigationProvider>
                </CartProvider>
            </AuthProvider>
        </ThemeProvider>
    );

    if (typeof window === 'undefined') {
        return <>{inner}</>;
    }

    return (
        <DndProvider backend={MultiBackend} options={getBackendOptions()}>
            {inner}
        </DndProvider>
    );
}
