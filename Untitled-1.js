/**
 * Run this model in Node.js
 *
 * npm install openai
 */
const OpenAI = require('openai');

const client = new OpenAI({
    baseURL: "https://open.bigmodel.cn",
    apiKey: process.env.CUSTOM_OPENAI_API_KEY
});

const messages = [
    {
        role: "user",
        content: [
            {
                type: "text",
                text: "INSERT_INPUT_HERE"
            },
        ],
    },
];

async function runChat() {
    while (true) {
        const response = await client.chat.completions.create({
            messages: messages,
            model: "glm-4.6",
            max_tokens: 4096,
        });

        const choice = response.choices[0];

        if (choice.message.tool_calls) {
            console.log("Tool calls:", choice.message.tool_calls);
            messages.push(choice.message);
            
            for (const toolCall of choice.message.tool_calls) {
                const toolResult = eval(toolCall.function.name)();
                messages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: [
                        {
                            type: "text",
                            text: toolResult
                        }
                    ]
                });
            }
        } else {
            console.log(`[Model Response] ${choice.message.content}`);
            break;
        }
    }
}

runChat().catch(console.error); 