
async function run() {
    try {
        const res = await fetch('http://localhost:3001/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                templateId: 'sns-post',
                inputs: { topic: 'Testing', tone: 'Professional' }
            })
        });
        const text = await res.text();
        console.log('Status:', res.status);
        console.log('Body:', text);
    } catch (e) {
        console.error(e);
    }
}
run();
