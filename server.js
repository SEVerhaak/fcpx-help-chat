import express from 'express';
import cors from 'cors';
import {AzureChatOpenAI, AzureOpenAIEmbeddings} from '@langchain/openai';
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { FaissStore } from "@langchain/community/vectorstores/faiss";

const model = new AzureChatOpenAI({ temperature: 1 });

const embeddings = new AzureOpenAIEmbeddings({
    temperature: 0,
    azureOpenAIApiEmbeddingsDeploymentName: process.env.AZURE_EMBEDDING_DEPLOYMENT_NAME
});

let vectorStore

async function createVectorstore() {
    const loader = new TextLoader("./vectorfiles/txt/test.txt");
    const docs = await loader.load();
    const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 100, chunkOverlap: 50 });
    const splitDocs = await textSplitter.splitDocuments(docs);
    console.log(`Document split into ${splitDocs.length} chunks. Now saving into vector store`);
    vectorStore = await MemoryVectorStore.fromDocuments(splitDocs, embeddings);
    return vectorStore;
}

const app = express();
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.get('/', async (req, res) => {
    const vectors = await createVectorstore();
    res.json({vectors: vectors});
})

app.post('/', async (req, res) => {
    const userMessages = req.body.messages;

    const engineeredPrompt = `You are a video editing expert. Your main expertise is Final Cut Pro X. Respond to the following question as a Final Cut Pro X expert. 
    Make sure to give detailed instructions on how to tackle the problem and ask if there are any more questions.`;

    const systemMessage = { role: 'system', content: engineeredPrompt };

    // Prepend the system message to the existing messages
    const messages = [systemMessage, ...userMessages];

    try {
        const stream = await model.stream(messages);

        res.setHeader("Content-Type", "text/plain");

        for await (const chunk of stream) {
            res.write(chunk.content);
        }

        res.end();

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error processing the request' });
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));
