import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { templates } from './schema';
import * as dotenv from 'dotenv';
dotenv.config();

const sqlite = new Database('sqlite.db');
const db = drizzle(sqlite);

async function main() {
    const data = [
        {
            id: "sns-post",
            name: "SNS投稿生成",
            description: "TwitterやInstagram向けの魅力的な投稿文を作成します。絵文字入り。",
            category: "SNS",
            promptBase: "あなたはSNSマーケティングのプロです。以下の情報を元に、読者の共感を呼び、いいねやリツイートをしたくなるような魅力的なSNS投稿を作成してください。絵文字を適切に使用し、ハッシュタグもいくつか提案してください。",
            formSchema: JSON.stringify({
                fields: [
                    { key: "topic", label: "投稿テーマ", type: "text", required: true, placeholder: "例：新商品のカフェラテ発売" },
                    { key: "target", label: "ターゲット", type: "text", required: false, placeholder: "例：20代女性" },
                    { key: "tone", label: "口調", type: "select", required: true, options: ["親しみやすい", "プロフェッショナル", "情熱的"] },
                ]
            }),
        },
        {
            id: "blog-structure",
            name: "ブログ見出し＋構成",
            description: "キーワードからSEOを意識したブログ記事の構成案を作成します。",
            category: "Blog",
            promptBase: "あなたはSEOに強いブログライターです。指定されたキーワードを元に、検索意図を満たすようなブログ記事の構成案（タイトル、H2見出し、H3見出し、各セクションの要点）を作成してください。",
            formSchema: JSON.stringify({
                fields: [
                    { key: "keyword", label: "対策キーワード", type: "text", required: true, placeholder: "例：ダイエット 食事制限" },
                    { key: "target_reader", label: "想定読者", type: "textarea", required: false, placeholder: "悩みの深さなど" },
                ]
            }),
        },
        {
            id: "sales-mail",
            name: "セールスメール（短文）",
            description: "アポイント獲得や商品紹介のための簡潔なメール文面を作成します。",
            category: "Business",
            promptBase: "あなたは優秀なセールスパーソンです。以下の相手に対して、失礼がなく、かつ興味を引くようなセールスメールの文面を作成してください。長くなりすぎないよう簡潔にまとめてください。",
            formSchema: JSON.stringify({
                fields: [
                    { key: "recipient_name", label: "相手の名前/会社名", type: "text", required: true },
                    { key: "product_name", label: "紹介する商品/サービス", type: "text", required: true },
                    { key: "goal", label: "メールの目的", type: "select", required: true, options: ["アポイント獲得", "資料送付", "セミナー案内"] },
                ]
            }),
        }
    ];

    console.log('Seeding templates...');
    for (const t of data) {
        await db.insert(templates).values(t).onConflictDoUpdate({ target: templates.id, set: t }).run();
    }
    console.log('Seeding finished.');
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
