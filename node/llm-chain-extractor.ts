import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { LLMChainExtractor } from "langchain/retrievers/document_compressors/chain_extract";
import { ContextualCompressionRetriever } from "langchain/retrievers/contextual_compression";

import "faiss-node";
import "dotenv/config";

process.env.LANGCHAIN_VERBOSE = "true";

async function run() {
  const directory = "../db/kongyiji";
  const embeddings = new OpenAIEmbeddings();

  const vectorStore = await FaissStore.load(directory, embeddings);

  const model = new ChatOpenAI();
  const compressor = LLMChainExtractor.fromLLM(model as any);
  const retriever = new ContextualCompressionRetriever({
    baseCompressor: compressor,
    baseRetriever: vectorStore.asRetriever(2),
  });

  const res = await retriever.invoke('茴香豆的作用是什么？');
  console.log(res);
}

run();
