import express from 'express';
import cors from 'cors';
import {AzureChatOpenAI, AzureOpenAIEmbeddings} from '@langchain/openai';
import {FaissStore} from "@langchain/community/vectorstores/faiss";
import router from './routes/vectorCreator.js';
import dotenv from 'dotenv';

dotenv.config();

console.log(process.env.AZURE_OPENAI_API_KEY)

const modelOpenAI = new AzureChatOpenAI({temperature: 1})

const embeddings = new AzureOpenAIEmbeddings({
    temperature: 0,
    azureOpenAIApiEmbeddingsDeploymentName: process.env.AZURE_EMBEDDING_DEPLOYMENT_NAME
});

let vectorStore = await FaissStore.load("./vectorfiles/vectorData/", embeddings); // dezelfde naam van de directory

const app = express();
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use('/vectorCreation', router)

app.get('/', async (req, res) => {
    res.json({testResponse: `It's alive`});
})

async function promptConstructor(prompt) {
    const userMessages = prompt;

    // Fetch the top 5 most relevant documents related to shortcuts
    const relevantDocs = await vectorStore.similaritySearch(
        'If there are keyboard shortcuts for the action the user wanted to perform in this document then say the key combination the user needs to make.',
        5
    );

    // Combine all relevant documents into a single context string
    const context = relevantDocs.map(doc => doc.pageContent).join("\n\n");

    // Define a detailed and professional system prompt for a Final Cut Pro X expert
    const engineeredPrompt = `
    You are a highly knowledgeable and professional Final Cut Pro X expert. Your job is to assist users with any questions they have regarding video editing using Final Cut Pro X.
    
    **Response Guidelines:**
    - Always answer with clarity, professionalism, and in-depth knowledge.
    - Use **markdown formatting** (e.g., bullet points, numbered steps, bold for emphasis, \`code formatting\` for shortcuts).
    - If the question relates to **keyboard shortcuts**, extract relevant information from the following context and include the correct shortcut(s) in your answer.
    - If multiple solutions exist, briefly explain each option with its pros and cons.
    - Provide clear, step-by-step instructions when applicable.
    - Ask if the user needs further clarification or help on the topic.
    
    **Context (for shortcut lookups):**
    ${context}
    
    Respond to the following question as a Final Cut Pro X expert.
    `
    ;

    const systemMessage = {role: 'system', content: engineeredPrompt.trim()};

    // Prepend the system message to the existing user messages
    const messages = [systemMessage, ...userMessages];

    return messages;
}


app.post('/', async (req, res) => {
    const userMessages = req.body.messages;

    const messages = await promptConstructor(userMessages);

    try {
        const stream = await modelOpenAI.stream(messages);

        res.setHeader("Content-Type", "text/plain");

        for await (const chunk of stream) {
            res.write(chunk.content);
        }

        res.end();

    } catch (err) {
        console.error(err);
        res.status(500).json({message: 'Error processing the request'});
    }
});

app.listen(8000, () => console.log(`Server running on port 8000`));

