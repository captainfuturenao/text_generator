import { useState } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { Loader2, Copy, ArrowLeft, RefreshCw, Send, Edit, Trash } from 'lucide-react';
import { motion } from 'framer-motion';

import { db } from '@/lib/db';
import { templates, Template } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { useAdmin } from '@/contexts/AdminContext';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FormField {
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'select';
    required: boolean;
    placeholder?: string;
    options?: string[];
}

interface TemplatePageProps {
    template: Template & { formSchema: string }; // Keep as string or parse in props? Parse in component for flexibility
}

export default function TemplatePage({ template }: TemplatePageProps) {
    const router = useRouter();
    const { isAdmin, adminPassword } = useAdmin();
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [historyId, setHistoryId] = useState<string | null>(null);

    const formSchema = JSON.parse(template.formSchema) as { fields: FormField[] };

    const handleChange = (key: string, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Simple validation matches HTML5 required attribute, but we can double check
        for (const field of formSchema.fields) {
            if (field.required && !formData[field.key]) {
                toast.error(`${field.label} は必須です`);
                return;
            }
        }

        setIsGenerating(true);
        setResult(null);

        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    templateId: template.id,
                    inputs: formData,
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'Generation failed');
            }

            const data = await res.json();
            setResult(data.output);
            setHistoryId(data.historyId);
            toast.success('生成完了！');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || '生成に失敗しました。もう一度お試しください。');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        if (result) {
            navigator.clipboard.writeText(result);
            toast.success('コピーしました');
        }
    };

    const handleReset = () => {
        setResult(null);
        setHistoryId(null);
        // Keep formData for easy refinement? Or clear? Keeping is better UX usually.
    };

    return (
        <>
            <Head>
                <title>{template.name} | Text Gen MVP</title>
            </Head>

            <div className="max-w-4xl mx-auto py-8 space-y-8">
                <Link href="/" className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 transition-colors mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    一覧に戻る
                </Link>

                {/* Form Section */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <section className="lg:col-span-2 space-y-6">
                        <div>
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">{template.name}</h1>
                            <p className="text-slate-600 mt-2">{template.description}</p>
                        </div>

                        <Card className="border-slate-200 shadow-sm">
                            <CardContent className="pt-6">
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {formSchema.fields.map((field) => (
                                        <div key={field.key} className="space-y-2">
                                            <Label htmlFor={field.key}>
                                                {field.label}
                                                {field.required && <span className="text-red-500 ml-1">*</span>}
                                            </Label>

                                            {field.type === 'text' && (
                                                <Input
                                                    id={field.key}
                                                    placeholder={field.placeholder}
                                                    required={field.required}
                                                    value={formData[field.key] || ''}
                                                    onChange={e => handleChange(field.key, e.target.value)}
                                                />
                                            )}

                                            {field.type === 'textarea' && (
                                                <Textarea
                                                    id={field.key}
                                                    placeholder={field.placeholder}
                                                    required={field.required}
                                                    rows={4}
                                                    value={formData[field.key] || ''}
                                                    onChange={e => handleChange(field.key, e.target.value)}
                                                />
                                            )}

                                            {field.type === 'select' && field.options && (
                                                <Select
                                                    value={formData[field.key]}
                                                    onValueChange={val => handleChange(field.key, val)}
                                                    required={field.required}
                                                >
                                                    <SelectTrigger id={field.key}>
                                                        <SelectValue placeholder="選択してください" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {field.options.map(opt => (
                                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </div>
                                    ))}

                                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isGenerating}>
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                生成中...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="mr-2 h-4 w-4" />
                                                生 成
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </section>

                    {/* Result Section */}
                    <section className="lg:col-span-3">
                        <motion.div
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="h-full"
                        >
                            {result ? (
                                <Card className="bg-slate-50/50 border-blue-100 shadow-md h-full flex flex-col">
                                    <CardHeader className="pb-3 border-b border-slate-100">
                                        <CardTitle className="text-lg flex items-center gap-2 text-slate-800">
                                            生成結果
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-1 p-0">
                                        <ScrollArea className="h-[400px] w-full p-6 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                                            {result}
                                        </ScrollArea>
                                    </CardContent>
                                    <CardFooter className="pt-4 border-t border-slate-100 gap-3 bg-white/50 backdrop-blur-sm rounded-b-lg">
                                        <Button onClick={handleCopy} variant="default" className="flex-1">
                                            <Copy className="mr-2 h-4 w-4" />
                                            コピー
                                        </Button>
                                        {historyId && (
                                            <Button asChild variant="outline" className="flex-1 bg-white text-slate-900 border-slate-300 hover:bg-slate-100">
                                                <Link href="/history">
                                                    履歴へ
                                                </Link>
                                            </Button>
                                        )}
                                        <Button onClick={handleReset} variant="ghost" size="icon" title="入力を修正して再生成">
                                            <RefreshCw className="h-4 w-4" />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ) : (
                                <div className="group h-full flex flex-col gap-4 items-center justify-center border-2 border-dashed border-slate-200 rounded-lg p-10 text-slate-400 bg-slate-50/50 relative">
                                    <div className="text-center">
                                        <p>左側のフォームに入力して<br />「生成」ボタンを押してください</p>
                                    </div>

                                    {/* Admin Controls - Visible primarily for Admin */}
                                    {isAdmin && (
                                        <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <Button variant="ghost" size="sm" className="text-xs text-slate-300 hover:text-slate-600 h-6 px-2" onClick={() => {
                                                router.push(`/create?edit=${template.id}`)
                                            }}>
                                                <Edit className="w-3 h-3 mr-1" />編集
                                            </Button>
                                            <Button variant="ghost" size="sm" className="text-xs text-slate-300 hover:text-red-400 h-6 px-2" onClick={async () => {
                                                if (!confirm('本当にこのテンプレートを削除しますか？')) return;

                                                try {
                                                    const res = await fetch(`/api/templates/${template.id}`, {
                                                        method: 'DELETE',
                                                        headers: { 'x-admin-password': adminPassword || '' }
                                                    });
                                                    if (res.ok) {
                                                        toast.success('削除しました');
                                                        router.push('/');
                                                    } else {
                                                        const d = await res.json();
                                                        toast.error(d.message || '削除失敗');
                                                    }
                                                } catch (e) {
                                                    console.error(e);
                                                    toast.error('削除エラー');
                                                }
                                            }}>
                                                <Trash className="w-3 h-3 mr-1" />削除
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </section>
                </div>
            </div>
        </>
    );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { id } = context.params as { id: string };

    const template = await db.select().from(templates).where(eq(templates.id, id)).get();

    if (!template) {
        return { notFound: true };
    }

    // Serialize dates
    const serializableTemplate = {
        ...template,
        createdAt: template.createdAt?.toISOString() || null,
        updatedAt: template.updatedAt?.toISOString() || null,
    };

    return {
        props: {
            template: serializableTemplate,
        },
    };
};
