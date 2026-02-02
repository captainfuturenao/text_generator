import { useState } from 'react';
import Head from 'next/head';
import { db } from '@/lib/db';
import { generations, templates } from '@/drizzle/schema';
import { desc, eq } from 'drizzle-orm';
import { GetServerSideProps } from 'next';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Copy, Clock, FileText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface HistoryItem {
    id: string;
    templateId: string;
    templateName: string | null;
    outputPreview: string;
    createdAt: string;
}

interface HistoryPageProps {
    initialHistory: HistoryItem[];
}

export default function HistoryPage({ initialHistory }: HistoryPageProps) {
    const [history, setHistory] = useState(initialHistory);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('コピーしました');
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('この履歴を削除しますか？')) return;

        try {
            const res = await fetch(`/api/history/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setHistory(prev => prev.filter(item => item.id !== id));
                toast.success('削除しました');
            } else {
                toast.error('削除に失敗しました');
            }
        } catch (error) {
            console.error(error);
            toast.error('エラーが発生しました');
        }
    };

    return (
        <>
            <Head>
                <title>履歴 | Text Gen MVP</title>
            </Head>

            <div className="space-y-6">
                <h1 className="text-3xl font-bold">生成履歴</h1>

                <div className="grid grid-cols-1 gap-4">
                    {history.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 border-2 border-dashed rounded-lg">
                            履歴はありません
                        </div>
                    ) : (
                        history.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card className="hover:shadow-md transition-shadow">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-blue-500" />
                                            <CardTitle className="text-base font-medium">
                                                {item.templateName || '不明なテンプレート'}
                                            </CardTitle>
                                        </div>
                                        <div className="flex items-center text-xs text-slate-400">
                                            <Clock className="mr-1 h-3 w-3" />
                                            {format(new Date(item.createdAt), 'yyyy/MM/dd HH:mm', { locale: ja })}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-2">
                                        <div className="relative bg-slate-50 p-3 rounded-md border text-sm font-mono text-slate-700 max-h-32 overflow-hidden mask-linear-fade">
                                            <p className="whitespace-pre-wrap">{item.outputPreview}</p>
                                            <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-slate-50 to-transparent" />
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex justify-end pt-2 gap-2">
                                        <Button variant="ghost" size="sm" onClick={(e) => handleDelete(item.id, e)} className="text-red-400 hover:text-red-600 hover:bg-red-50">
                                            <Trash2 className="mr-2 h-3 w-3" />
                                            削除
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleCopy(item.outputPreview)}>
                                            <Copy className="mr-2 h-3 w-3" />
                                            コピー
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}

export const getServerSideProps: GetServerSideProps = async () => {
    try {
        const historyData = await db
            .select({
                id: generations.id,
                templateId: generations.templateId,
                templateName: templates.name,
                outputPreview: generations.outputText,
                createdAt: generations.createdAt,
            })
            .from(generations)
            .leftJoin(templates, eq(generations.templateId, templates.id))
            .orderBy(desc(generations.createdAt))
            .all();

        const serializableHistory = historyData.map(h => ({
            ...h,
            createdAt: h.createdAt ? h.createdAt.toISOString() : new Date().toISOString(),
        }));

        return {
            props: { initialHistory: serializableHistory },
        };
    } catch (e) {
        console.error(e);
        return { props: { initialHistory: [] } };
    }
};
