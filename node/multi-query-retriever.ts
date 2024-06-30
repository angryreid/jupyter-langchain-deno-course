import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { MultiQueryRetriever } from "langchain/retrievers/multi_query";

import "faiss-node";
import "dotenv/config";

async function run() {
  const directory = "../db/kongyiji";
  const embeddings = new OpenAIEmbeddings();
  const vectorStore = await FaissStore.load(directory, embeddings);

  const model = new ChatOpenAI()
  const retriever = MultiQueryRetriever.fromLLM({
    llm: model as any,
    retriever: vectorStore.asRetriever(3),
    queryCount: 3,
    verbose: true,
  })

  const res = await retriever.invoke('茴香豆的作用是什么？');
  console.log(res);
}

run();
