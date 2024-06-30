import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { OpenAIEmbeddings } from "@langchain/openai";

import 'faiss-node'
import 'dotenv/config'

async function run() {
    const directory = "../db/kongyiji";
    const embeddings = new OpenAIEmbeddings();
    const vectorStore = await FaissStore.load(directory, embeddings);
    
    const retriever = vectorStore.asRetriever(2);
    const res = await retriever.invoke('茴香豆的作用是什么？');

    console.log(res);
}

run();