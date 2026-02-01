
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

interface AdminContextType {
    isAdmin: boolean;
    adminPassword: string | null;
    login: (password: string) => boolean;
    logout: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminPassword, setAdminPassword] = useState<string | null>(null);

    // Persist login state (simple version using localStorage)
    useEffect(() => {
        const storedPass = localStorage.getItem('admin_pass');
        if (storedPass) {
            setAdminPassword(storedPass); // We don't validate against server here for MVP, just assume possession is enough for client UI. Server validates on API calls.
            setIsAdmin(true);
        }
    }, []);

    const login = (password: string) => {
        // In a real app, verify against API. Here we store it and let the API reject if wrong.
        // Or we can do a quick dry-run check if needed.
        if (!password) return false;

        localStorage.setItem('admin_pass', password);
        setAdminPassword(password);
        setIsAdmin(true);
        toast.success('管理者としてログインしました');
        return true;
    };

    const logout = () => {
        localStorage.removeItem('admin_pass');
        setAdminPassword(null);
        setIsAdmin(false);
        toast.info('ログアウトしました');
    };

    return (
        <AdminContext.Provider value={{ isAdmin, adminPassword, login, logout }}>
            {children}
        </AdminContext.Provider>
    );
}

export const useAdmin = () => {
    const context = useContext(AdminContext);
    if (context === undefined) {
        throw new Error('useAdmin must be used within an AdminProvider');
    }
    return context;
};
