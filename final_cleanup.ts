import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { v4 as uuidv4 } from 'uuid';
import { inArray } from 'drizzle-orm';
import { templates } from './drizzle/schema';

// Standard Templates Data
const cleanTemplates = [
    {
        name: 'SNS投稿生成',
        description: 'TwitterやInstagram向けの魅力的な投稿文を作成します。絵文字入り。',
        category: 'SNS',
        promptBase: 'あなたはSNSマーケティングのプロです。以下の情報を元に、読者の共感を呼び、いいねやリツイートをしたくなるような魅力的なSNS投稿を作成してください。絵文字を適切に使用し、ハッシュタグもいくつか提案してください。\n\n[テーマ]: {{topic}}\n[ターゲット]: {{target}}\n[トーン]: {{tone}}',
        formSchema: {
            fields: [
                { key: 'topic', label: '投稿テーマ', type: 'text', placeholder: '例：新商品のカフェラテ発売', required: true },
                { key: 'target', label: 'ターゲット', type: 'text', placeholder: '例：20代女性', required: false },
                { key: 'tone', label: 'トーン', type: 'select', options: ['親しみやすい', 'プロフェッショナル', '情熱的'], required: true }
            ]
        },
        displayOrder: 100
    },
    {
        name: 'ブログ構成案作成',
        description: 'キーワードからSEOを意識したブログ記事の構成案を作成します',
        category: 'ブログ',
        promptBase: 'あなたはSEOに強いブログライターです。指定されたキーワードを元に、検索意図を満たすようなブログ記事の構成案（タイトル、H2見出し、H3見出し、各セクションの要点）を作成してください。\n\n[キーワード]: {{keyword}}\n[ターゲット]: {{target}}',
        formSchema: {
            fields: [
                { key: 'keyword', label: '対策キーワード', type: 'text', placeholder: '例：ダイエット 食事制限', required: true },
                { key: 'target', label: '想定読者', type: 'textarea', placeholder: '悩みの深さなど', required: false }
            ]
        },
        displayOrder: 90
    },
    {
        name: '議事録生成',
        description: '会議のメモから構造化された議事録を作成します',
        category: 'ビジネス',
        promptBase: '以下の会議メモを元に、決定事項、Todo、次回のアジェンダを含んだ明確な議事録を作成してください。\n\n[会議メモ]:',
        formSchema: {
            fields: [
                { key: 'memo', label: '会議メモ', type: 'textarea', placeholder: '会議中のメモをここに貼り付けてください', required: true }
            ]
        },
        displayOrder: 80
    },
    {
        name: '日報作成',
        description: '今日の実績と明日の予定から日報を生成します',
        category: 'ビジネス',
        promptBase: '以下の情報を元に、上司に提出する簡潔で分かりやすい日報を作成してください。\n\n[今日の実績]:\n{{today}}\n\n[明日の予定]:\n{{tomorrow}}\n\n[課題・共有事項]:\n{{issues}}',
        formSchema: {
            fields: [
                { key: 'today', label: '今日の実績', type: 'textarea', placeholder: '今日やったこと', required: true },
                { key: 'tomorrow', label: '明日の予定', type: 'textarea', placeholder: '明日やること', required: true },
                { key: 'issues', label: '課題・共有事項', type: 'textarea', placeholder: '困っていることや報告事項', required: true }
            ]
        },
        displayOrder: 70
    },
    {
        name: 'ビジネスメール返信',
        description: '受信メールの内容に対して失礼のない返信文を作成します',
        category: 'ビジネス',
        promptBase: '以下の受信メールに対して、{{tone}}なトーンで返信メールを作成してください。\n返信の要点は以下の通りです：{{points}}\n\n[受信メール]:\n{{received_email}}',
        formSchema: {
            fields: [
                { key: 'received_email', label: '受信メール内容', type: 'textarea', placeholder: '相手からのメールを貼り付け', required: true },
                { key: 'points', label: '返信の要点', type: 'textarea', placeholder: '伝えたいこと、承諾/お断りなど', required: true },
                { key: 'tone', label: 'トーン', type: 'text', placeholder: '丁寧、謝罪、親しい、など', required: true }
            ]
        },
        displayOrder: 60
    },
    {
        name: '会議アジェンダ作成',
        description: '会議の目的から効果的なアジェンダを提案します',
        category: 'ビジネス',
        promptBase: '以下の会議目的と参加者を考慮し、効率的で成果の出る会議アジェンダ（時間配分付き）を作成してください。\n\n[会議の目的]: {{purpose}}\n[参加者]: {{attendees}}\n[会議時間]: {{duration}}',
        formSchema: {
            fields: [
                { key: 'purpose', label: '会議の目的', type: 'textarea', placeholder: '何を決めたい会議か', required: true },
                { key: 'attendees', label: '参加者・役割', type: 'text', placeholder: 'マネージャー、開発メンバーなど', required: true },
                { key: 'duration', label: '会議時間', type: 'text', placeholder: '60分', required: true }
            ]
        },
        displayOrder: 50
    },
    {
        name: 'プレスリリース作成',
        description: '新サービスやイベントの魅力的なプレスリリースを作成します',
        category: 'ビジネス',
        promptBase: '以下の情報を元に、メディアに取り上げられやすい魅力的なプレスリリースを作成してください。\n\n[発表内容]: {{content}}\n[ターゲット]: {{target}}\n[アピールポイント]: {{points}}',
        formSchema: {
            fields: [
                { key: 'content', label: '発表内容', type: 'textarea', placeholder: '新商品の発売、イベント開催など', required: true },
                { key: 'target', label: 'ターゲット層', type: 'text', placeholder: '20代女性、経営者など', required: true },
                { key: 'points', label: 'アピールポイント', type: 'textarea', placeholder: '業界初、最大級など', required: true }
            ]
        },
        displayOrder: 40
    },
    {
        name: '求人票作成',
        description: '応募が集まる魅力的な求人票（Job Description）を作成します',
        category: 'ビジネス',
        promptBase: '以下の条件で、求職者にとって魅力的な求人票の募集要項を作成してください。\n\n[職種]: {{job_title}}\n[必須スキル]: {{requirements}}\n[歓迎スキル]: {{preferred}}\n[求める人物像]: {{persona}}',
        formSchema: {
            fields: [
                { key: 'job_title', label: '職種名', type: 'text', placeholder: 'フロントエンドエンジニア', required: true },
                { key: 'requirements', label: '必須スキル', type: 'textarea', placeholder: 'React実務経験3年以上など', required: true },
                { key: 'preferred', label: '歓迎スキル', type: 'textarea', placeholder: 'Next.js, TypeScriptなど', required: true },
                { key: 'persona', label: '求める人物像', type: 'textarea', placeholder: '自走できる方、チームワークを重視する方', required: true }
            ]
        },
        displayOrder: 30
    }
];

async function cleanup() {
    console.log('Starting cleanup...');

    // Dynamic import to ensure dotenv works
    const { db } = await import('./lib/db');

    const targetNames = cleanTemplates.map(t => t.name);

    // 1. Delete ALL matches by name
    try {
        await db.delete(templates).where(inArray(templates.name, targetNames)).run();
        console.log('Deleted existing standard templates (if any).');
    } catch (e) {
        console.error('Delete step failed (might be first run):', e);
    }

    // 2. Re-insert clean versions
    console.log('Inserting clean templates...');
    for (const t of cleanTemplates) {
        const id = uuidv4();
        try {
            await db.insert(templates).values({
                id,
                ...t,
                formSchema: JSON.stringify(t.formSchema),
                isPublic: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            }).run();
            console.log(`Added: ${t.name}`);
        } catch (e) {
            console.error(`Failed to add ${t.name}:`, e);
        }
    }
    console.log('Cleanup Done.');
}

cleanup();
