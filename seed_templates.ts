
import { db } from './lib/db';
import { templates } from './drizzle/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq, inArray } from 'drizzle-orm';

const newTemplates = [
    {
        id: uuidv4(),
        name: '議事録生成',
        description: '会議のメモから構造化された議事録を作成します',
        category: 'ビジネス',
        promptBase: '以下の会議メモを元に、決定事項、Todo、次回のアジェンダを含んだ明確な議事録を作成してください。\n\n[会議メモ]:',
        formSchema: JSON.stringify({
            fields: [
                { key: 'memo', label: '会議メモ', type: 'textarea', placeholder: '会議中のメモをここに貼り付けてください', required: true }
            ]
        }),
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: uuidv4(),
        name: '日報作成',
        description: '今日の実績と明日の予定から日報を生成します',
        category: 'ビジネス',
        promptBase: '以下の情報を元に、上司に提出する簡潔で分かりやすい日報を作成してください。\n\n[今日の実績]:\n{{today}}\n\n[明日の予定]:\n{{tomorrow}}\n\n[課題・共有事項]:\n{{issues}}',
        formSchema: JSON.stringify({
            fields: [
                { key: 'today', label: '今日の実績', type: 'textarea', placeholder: '今日やったこと', required: true },
                { key: 'tomorrow', label: '明日の予定', type: 'textarea', placeholder: '明日やること', required: true },
                { key: 'issues', label: '課題・共有事項', type: 'textarea', placeholder: '困っていることや報告事項', required: true }
            ]
        }),
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: uuidv4(),
        name: 'ビジネスメール返信',
        description: '受信メールの内容に対して失礼のない返信文を作成します',
        category: 'ビジネス', // Changed from 'メール' to 'ビジネス' for consistency
        promptBase: '以下の受信メールに対して、{{tone}}なトーンで返信メールを作成してください。\n返信の要点は以下の通りです：{{points}}\n\n[受信メール]:\n{{received_email}}',
        formSchema: JSON.stringify({
            fields: [
                { key: 'received_email', label: '受信メール内容', type: 'textarea', placeholder: '相手からのメールを貼り付け', required: true },
                { key: 'points', label: '返信の要点', type: 'textarea', placeholder: '伝えたいこと、承諾/お断りなど', required: true },
                { key: 'tone', label: 'トーン', type: 'text', placeholder: '丁寧、謝罪、親しい、など', required: true }
            ]
        }),
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: uuidv4(),
        name: '会議アジェンダ作成',
        description: '会議の目的から効果的なアジェンダを提案します',
        category: 'ビジネス',
        promptBase: '以下の会議目的と参加者を考慮し、効率的で成果の出る会議アジェンダ（時間配分付き）を作成してください。\n\n[会議の目的]: {{purpose}}\n[参加者]: {{attendees}}\n[会議時間]: {{duration}}',
        formSchema: JSON.stringify({
            fields: [
                { key: 'purpose', label: '会議の目的', type: 'textarea', placeholder: '何を決めたい会議か', required: true },
                { key: 'attendees', label: '参加者・役割', type: 'text', placeholder: 'マネージャー、開発メンバーなど', required: true },
                { key: 'duration', label: '会議時間', type: 'text', placeholder: '60分', required: true }
            ]
        }),
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: uuidv4(),
        name: 'プレスリリース作成',
        description: '新サービスやイベントの魅力的なプレスリリースを作成します',
        category: 'ビジネス',
        promptBase: '以下の情報を元に、メディアに取り上げられやすい魅力的なプレスリリースを作成してください。\n\n[発表内容]: {{content}}\n[ターゲット]: {{target}}\n[アピールポイント]: {{points}}',
        formSchema: JSON.stringify({
            fields: [
                { key: 'content', label: '発表内容', type: 'textarea', placeholder: '新商品の発売、イベント開催など', required: true },
                { key: 'target', label: 'ターゲット層', type: 'text', placeholder: '20代女性、経営者など', required: true },
                { key: 'points', label: 'アピールポイント', type: 'textarea', placeholder: '業界初、最大級など', required: true }
            ]
        }),
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: uuidv4(),
        name: '求人票作成', // Job Description
        description: '応募が集まる魅力的な求人票（Job Description）を作成します',
        category: 'ビジネス',
        promptBase: '以下の条件で、求職者にとって魅力的な求人票の募集要項を作成してください。\n\n[職種]: {{job_title}}\n[必須スキル]: {{requirements}}\n[歓迎スキル]: {{preferred}}\n[求める人物像]: {{persona}}',
        formSchema: JSON.stringify({
            fields: [
                { key: 'job_title', label: '職種名', type: 'text', placeholder: 'フロントエンドエンジニア', required: true },
                { key: 'requirements', label: '必須スキル', type: 'textarea', placeholder: 'React実務経験3年以上など', required: true },
                { key: 'preferred', label: '歓迎スキル', type: 'textarea', placeholder: 'Next.js, TypeScriptなど', required: true },
                { key: 'persona', label: '求める人物像', type: 'textarea', placeholder: '自走できる方、チームワークを重視する方', required: true }
            ]
        }),
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

async function seed() {
    console.log('Cleaning up ALL "ビジネス" category templates to ensure clean slate...');
    // We will delete all templates with these names to be safe from duplicates
    const names = newTemplates.map(t => t.name);
    try {
        await db.delete(templates).where(inArray(templates.name, names)).run();
        console.log('Deleted existing templates with matching names.');
    } catch (e) {
        console.error('Delete error:', e);
    }

    console.log('Seeding corrected templates...');
    for (const t of newTemplates) {
        try {
            await db.insert(templates).values(t).run();
            console.log(`Added: ${t.name}`);
        } catch (e) {
            console.error(`Failed to add ${t.name}:`, e);
        }
    }
    console.log('Done.');
}

seed();
