import { useState, useEffect } from 'react';
import { auth } from '../firebase/config';

type User = any;

interface AuthState {
    user: User | null;
    loading: boolean;
}

export const useAuth = (): AuthState => {
    const [user, setUser] = useState<User | null>(auth.currentUser);
    const [loading] = useState<boolean>(false);

    useEffect(() => {
        // Periodically sync user state with the mock auth.currentUser in configuration
        const interval = setInterval(() => {
            if (auth.currentUser !== user) {
                setUser(auth.currentUser);
            }
        }, 500);
        return () => clearInterval(interval);
    }, [user]);

    return { user, loading };
};
