import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { toast } from 'sonner';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdmin } from '@/contexts/AdminContext';

interface FormField {
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'select';
    required: boolean;
    placeholder?: string;
    options?: string[]; // Comma separated string for input, array for output
}

export default function CreateTemplatePage() {
    const router = useRouter();
    const { isAdmin, adminPassword } = useAdmin();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Template Basic Info
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [promptBase, setPromptBase] = useState('');
    const [displayOrder, setDisplayOrder] = useState(0);
    const [adminKey, setAdminKey] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);

    // Schema Builder State
    const [fields, setFields] = useState<FormField[]>([
        { key: 'topic', label: 'テーマ', type: 'text', required: true, placeholder: '例：ブログのテーマ' }
    ]);

    useEffect(() => {
        // Prefer context password if available
        if (adminPassword) {
            setAdminKey(adminPassword);
        } else if (router.query.pass) {
            setAdminKey(router.query.pass as string);
        }

        if (router.query.edit) {
            setIsEditMode(true);
            const id = router.query.edit as string;
            fetch(`/api/templates/${id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.template) {
                        const t = data.template;
                        setName(t.name);
                        setDescription(t.description);
                        setCategory(t.category);
                        setPromptBase(t.promptBase);
                        setDisplayOrder(t.displayOrder || 0);
                        const schema = JSON.parse(t.formSchema);
                        if (schema.fields) setFields(schema.fields);
                    }
                })
                .catch(console.error);
        }
    }, [router.query.edit, adminPassword, router.query.pass]);

    const addField = () => {
        setFields([...fields, { key: '', label: '', type: 'text', required: true }]);
    };

    const removeField = (index: number) => {
        setFields(fields.filter((_, i) => i !== index));
    };

    const updateField = (index: number, key: keyof FormField, value: any) => {
        const newFields = [...fields];
        newFields[index] = { ...newFields[index], [key]: value };
        setFields(newFields);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic Validation
        if (!name || !description || !category || !promptBase) {
            toast.error('基本情報をすべて入力してください');
            return;
        }

        if (fields.length === 0) {
            toast.error('少なくとも1つの入力フィールドを設定してください');
            return;
        }

        for (const f of fields) {
            if (!f.key || !f.label) {
                toast.error('フィールドの「キー」と「ラベル」は必須です');
                return;
            }
        }

        setIsSubmitting(true);

        // Transform fields (e.g. handle options string to array if we had UI for it, currently simplified)
        // For MVP, select options are not implemented in the UI builder to keep it simple, 
        // or we can treat placeholder as options for select type? 
        // Let's stick to text/textarea for simplicity or add simple options support.
        // Adding simple CSV check for options if type is select.

        const processedFields = fields.map(f => {
            if (f.type === 'select' && f.placeholder) {
                return { ...f, options: f.placeholder.split(',').map(s => s.trim()) };
            }
            return f;
        });

        const payload = {
            name,
            description,
            category,
            promptBase,
            displayOrder,
            formSchema: { fields: processedFields }
        };

        try {
            const url = isEditMode ? `/api/templates/${router.query.edit}` : '/api/templates';
            const method = isEditMode ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-password': adminKey
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to save template');
            }

            toast.success(isEditMode ? 'テンプレートを更新しました' : 'テンプレートを作成しました');
            router.push('/');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Head>
                <title>新規ツール作成 | Text Gen MVP</title>
            </Head>

            <div className="max-w-4xl mx-auto py-8 space-y-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">{isEditMode ? 'ツール編集' : '新規ツール作成'}</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Basic Info & Prompt */}
                    <div className="space-y-8">
                        <section>
                            <h2 className="text-xl font-semibold mb-4">1. 基本情報</h2>
                            <Card>
                                <CardContent className="space-y-4 pt-6">
                                    <div className="space-y-2 bg-yellow-50 p-4 rounded-md border border-yellow-200">
                                        <Label className="text-yellow-800">管理者パスワード (設定されている場合)</Label>
                                        <Input
                                            type="password"
                                            value={adminKey}
                                            onChange={e => setAdminKey(e.target.value)}
                                            placeholder="Admin Password"
                                        />
                                        <p className="text-xs text-yellow-600">
                                            ※ 環境変数 ADMIN_PASSWORD が設定されている場合は必須です。
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>ツール名</Label>
                                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="例: 謝罪メール生成" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>説明</Label>
                                        <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="ツールの概要" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>カテゴリ</Label>
                                        <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="例: ビジネス" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>表示順 (大きい数字ほど上に表示)</Label>
                                        <Input
                                            type="number"
                                            value={displayOrder}
                                            onChange={e => setDisplayOrder(parseInt(e.target.value) || 0)}
                                            placeholder="0"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-4">2. AIプロンプト設定</h2>
                            <Card>
                                <CardHeader>
                                    <CardDescription>
                                        AIへの指示を書きます。ユーザーの入力値は {'\n'}
                                        <code>Key: Value</code> の形式でプロンプトの末尾に自動的に追加されます。
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <Label>ベースプロンプト</Label>
                                    <Textarea
                                        value={promptBase}
                                        onChange={e => setPromptBase(e.target.value)}
                                        placeholder="あなたはプロのライターです。以下の情報を元に..."
                                        rows={8}
                                        required
                                    />
                                </CardContent>
                            </Card>
                        </section>
                    </div>

                    {/* Right Column: Form Builder */}
                    <div className="space-y-8">
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold">3. 入力フォーム設定</h2>
                                <Button onClick={addField} size="sm" className="bg-slate-900 text-white hover:bg-slate-700">
                                    <Plus className="h-4 w-4 mr-1" /> 追加
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {fields.map((field, index) => (
                                    <Card key={index} className="relative">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-2 right-2 text-slate-400 hover:text-red-500"
                                            onClick={() => removeField(index)}
                                            disabled={fields.length === 1}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                        <CardContent className="pt-6 space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>ラベル (表示名)</Label>
                                                    <Input
                                                        value={field.label}
                                                        onChange={e => updateField(index, 'label', e.target.value)}
                                                        placeholder="例: 宛名"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>キー (内部ID)</Label>
                                                    <Input
                                                        value={field.key}
                                                        onChange={e => updateField(index, 'key', e.target.value)}
                                                        placeholder="例: recipient"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>タイプ</Label>
                                                    <Select value={field.type} onValueChange={val => updateField(index, 'type', val)}>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="text">1行テキスト</SelectItem>
                                                            <SelectItem value="textarea">複数行テキスト</SelectItem>
                                                            <SelectItem value="select">選択肢</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="flex items-center space-x-2 pt-8">
                                                    <input
                                                        type="checkbox"
                                                        id={`req-${index}`}
                                                        checked={field.required}
                                                        onChange={e => updateField(index, 'required', e.target.checked)}
                                                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <Label htmlFor={`req-${index}`}>必須項目</Label>
                                                </div>
                                            </div>
                                            {field.type === 'select' && (
                                                <div className="space-y-2">
                                                    <Label>選択肢 (カンマ区切り)</Label>
                                                    <Input
                                                        value={field.placeholder || ''}
                                                        onChange={e => updateField(index, 'placeholder', e.target.value)}
                                                        placeholder="例: A, B, C"
                                                    />
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </section>

                        <div className="pt-4">
                            <Button onClick={handleSubmit} className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg" disabled={isSubmitting}>
                                {isSubmitting ? '保存中...' : 'ツールを作成して保存'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
