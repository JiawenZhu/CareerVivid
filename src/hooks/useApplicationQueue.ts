import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { ApplicationQueueItem } from '../types';
import { subscribeApplicationQueue } from '../services/applyAgentService';

export function useApplicationQueue() {
  const { currentUser } = useAuth();
  const [items, setItems] = useState<ApplicationQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser?.uid) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = subscribeApplicationQueue(
      currentUser.uid,
      nextItems => {
        setItems(nextItems);
        setIsLoading(false);
      },
      err => {
        setError(err.message);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  return { items, isLoading, error };
}
