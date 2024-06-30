import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { OpenAIEmbeddings } from "@langchain/openai";
import "dotenv/config";
import { ScoreThresholdRetriever } from "langchain/retrievers/score_threshold";

async function run() {
  const directory = "../db/kongyiji";
  const embeddings = new OpenAIEmbeddings();
  const vectorStore = await FaissStore.load(directory, embeddings);

  const retriever = ScoreThresholdRetriever.fromVectorStore(vectorStore, {
    minSimilarityScore: 0.45,
    maxK: 5,
    kIncrement: 1
  });

  const res = await retriever.invoke('茴香豆的作用是什么？');
  console.log(res);
}

run();
