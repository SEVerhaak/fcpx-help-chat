import express from "express";
import {TextLoader} from "langchain/document_loaders/fs/text";
import {RecursiveCharacterTextSplitter} from "langchain/text_splitter";
import {MemoryVectorStore} from "langchain/vectorstores/memory";
import {FaissStore} from "@langchain/community/vectorstores/faiss";
import {AzureOpenAIEmbeddings} from "@langchain/openai";

const embeddings = new AzureOpenAIEmbeddings({
    temperature: 0,
    azureOpenAIApiEmbeddingsDeploymentName: process.env.AZURE_EMBEDDING_DEPLOYMENT_NAME
});

const router = express.Router();

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.options('/', (req, res) => {
    res.header('Allow', 'GET,OPTIONS,POST');
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.status(204).send();
});

router.options('/:id', (req, res) => {
    res.header('Allow', 'GET,PUT,DELETE,OPTIONS, PATCH');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,DELETE,OPTIONS, PATCH');
    res.status(204).send();
});

let vectorStore

async function createVectorstore() {
    const loader = new TextLoader("./vectorfiles/pdf/Application.pdf");
    const docs = await loader.load();
    const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 300, chunkOverlap: 100 });
    const splitDocs = await textSplitter.splitDocuments(docs);
    console.log(`Document split into ${splitDocs.length} chunks. Now saving into vector store`);
    vectorStore = await MemoryVectorStore.fromDocuments(splitDocs, embeddings);
    vectorStore = await FaissStore.fromDocuments(splitDocs, embeddings);
    await vectorStore.save("./vectorfiles/vectorData/"); // geef hier de naam van de directory waar je de data gaat opslaan
    return vectorStore;
}

router.get('/', async (req, res) => {
    const vectors = await createVectorstore();
    res.json({vectors: vectors});
})

export default router;