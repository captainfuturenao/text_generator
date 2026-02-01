import React, { useState } from 'react';
import Link from 'next/link';
import { Toaster, toast } from 'sonner';
import { useAdmin } from '@/contexts/AdminContext';
import { Button } from '@/components/ui/button';
import { Lock, Unlock } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function Layout({ children }: { children: React.ReactNode }) {
    const { isAdmin, login, logout } = useAdmin();
    const [passwordInput, setPasswordInput] = useState('');
    const [isLoginOpen, setIsLoginOpen] = useState(false);

    const handleLogin = () => {
        if (login(passwordInput)) {
            setIsLoginOpen(false);
            setPasswordInput('');
        } else {
            toast.error('パスワードを入力してください');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
            <header className="sticky top-0 z-10 w-full border-b bg-white/80 backdrop-blur-md px-6 h-16 flex items-center justify-between shadow-sm">
                <Link href="/" className="font-bold text-xl tracking-tight hover:opacity-80 transition-opacity">
                    Text Gen MVP
                </Link>
                <nav className="flex gap-4">
                    <Link href="/" className="text-sm font-medium hover:text-blue-600 transition-colors">テンプレート</Link>
                    <Link href="/history" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                        履歴
                    </Link>
                    {isAdmin && (
                        <Link href="/create" className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
                            ツール作成 (Admin)
                        </Link>
                    )}
                </nav>
            </header>
            <main className="container mx-auto p-6 max-w-4xl animate-in fade-in duration-500 flex-1">
                {children}
            </main>

            <footer className="border-t py-6 bg-slate-100 mt-12">
                <div className="container mx-auto px-6 flex justify-between items-center text-xs text-slate-400">
                    <p>&copy; 2024 Text Gen MVP</p>

                    {isAdmin ? (
                        <Button variant="ghost" size="sm" onClick={logout} className="text-slate-400 hover:text-slate-600">
                            <Unlock className="w-3 h-3 mr-1" />
                            Admin Logout
                        </Button>
                    ) : (
                        <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-slate-500">
                                    <Lock className="w-3 h-3 mr-1" />
                                    Admin
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>管理者ログイン</DialogTitle>
                                    <DialogDescription>
                                        テンプレートの編集・削除を行うにはパスワードを入力してください。
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <Input
                                        id="admin-password"
                                        type="password"
                                        placeholder="Password"
                                        value={passwordInput}
                                        onChange={(e) => setPasswordInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                                    />
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleLogin}>ログイン</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </footer>

            <Toaster />
        </div>
    );
}
