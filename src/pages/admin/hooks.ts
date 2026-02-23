import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserProfile } from '../../types';

export const useUsers = () => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const usersCol = collection(db, 'users');
        const q = query(usersCol, orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, snapshot => {
            const usersFromDb = snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile));
            setUsers(usersFromDb);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching users:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);
    return { users, loading, setUsers };
};

export const useUsageLogs = () => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const logsCol = collection(db, 'usage_logs');
        const q = query(logsCol, orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, snapshot => {
            const logsFromDb = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setLogs(logsFromDb);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching usage logs:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);
    return { logs, loading };
};
