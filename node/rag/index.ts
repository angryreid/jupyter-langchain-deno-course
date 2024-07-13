// Importing necessary modules and classes
import { FaissStore } from '@langchain/community/vectorstores/faiss'; // Import FaissStore for vector storage
import { OpenAIEmbeddings } from '@langchain/openai'; // Import OpenAIEmbeddings for embeddings
import 'dotenv/config'; // Import dotenv for environment variable configuration
import path from 'path'; // Import path for file path operations
import { JSONChatHistory } from './json-chat-history'; // Import JSONChatHistory for chat history management
// Importing various utilities for chat prompt and message handling
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';
import {
  RunnableSequence,
  RunnablePassthrough,
  RunnableWithMessageHistory,
  Runnable,
} from '@langchain/core/runnables';
import { ChatOpenAI } from '@langchain/openai'; // Import ChatOpenAI for OpenAI chat functionality
import { StringOutputParser } from '@langchain/core/output_parsers'; // Import StringOutputParser for parsing output strings
import { HumanMessage, AIMessage } from '@langchain/core/messages'; // Import message types
import { Document } from '@langchain/core/documents'; // Import Document for document handling

// Function to load the vector store from a specified directory
async function loadVectorStore() {
  const directory = path.join(__dirname, '../../db/qiu'); // Define the directory path
  const embeddings = new OpenAIEmbeddings(); // Initialize OpenAI embeddings
  const vectorStore = await FaissStore.load(directory, embeddings); // Load the vector store

  return vectorStore; // Return the loaded vector store
}

// Function to get the rephrase chain for processing input
async function getRephraseChain() {
  // Define the prompt template for rephrasing
  const rephraseChainPrompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      '给定以下对话和一个后续问题，请将后续问题重述为一个独立的问题。请注意，重述的问题应该包含足够的信息，使得没有看过对话历史的人也能理解。',
    ],
    new MessagesPlaceholder('history'),
    ['human', '将以下问题重述为一个独立的问题：\n{question}'],
  ]);

  // Define the sequence of operations for rephrasing
  const rephraseChain = RunnableSequence.from([
    rephraseChainPrompt,
    new ChatOpenAI({
      temperature: 0.4, // Set the temperature for deterministic output
    }),
    new StringOutputParser(), // Parse the output to a string
  ]);

  return rephraseChain; // Return the rephrase chain
}

// Function to test the rephrase chain with sample input
async function testRephraseChain() {
  // Define sample history messages
  const historyMessages = [
    new HumanMessage('你好，我叫小明'),
    new AIMessage('你好小明'),
  ];
  const rephraseChain = await getRephraseChain(); // Get the rephrase chain

  const question = '你觉得我的名字怎么样？'; // Define the question to be rephrased
  // Invoke the rephrase chain with the history and question
  const standaloneQuestion = await rephraseChain.invoke({
    history: historyMessages,
    question,
  });

  console.log(standaloneQuestion); // Log the rephrased question
}

// Function to get the Retrieve and Generate (RAG) chain for processing input
export async function getRagChain(): Promise<Runnable> {
  const vectorStore = await loadVectorStore(); // Load the vector store
  const retriever = vectorStore.asRetriever(2); // Set the retriever with a limit

  // Function to convert documents to a string
  const convertDocsToString = (documents: Document[]): string => {
    return documents.map((document) => document.pageContent).join('\n');
  };

  // Define the sequence for retrieving context and converting documents
  const contextRetrieverChain = RunnableSequence.from([
    (input) => input.standalone_question,
    retriever,
    convertDocsToString,
  ]);

  // Define the system template for the prompt
  const SYSTEM_TEMPLATE = `
    你是一个熟读刘慈欣的《球状闪电》的终极原着党，精通根据作品原文详细解释和回答问题，你在回答时会引用作品原文。
    并且回答时仅根据原文，尽可能回答用户问题，如果原文中没有相关内容，你可以回答“原文中没有相关内容”，

    以下是原文中跟用户回答相关的内容：
    {context}
  `;

  // Define the prompt with the system template
  const prompt = ChatPromptTemplate.fromMessages([
    ['system', SYSTEM_TEMPLATE],
    new MessagesPlaceholder('history'),
    ['human', '现在，你需要基于原文，回答以下问题：\n{standalone_question}`'],
  ]);
  const model = new ChatOpenAI(); // Initialize the chat model
  const rephraseChain = await getRephraseChain(); // Get the rephrase chain

  // Assign the standalone question to the prompt
  const assignedStandaloneQuestion = {
    standalone_question: rephraseChain
  }

  // Assign the context to the prompt
  const assignedContext = {
    context: contextRetrieverChain
  }

  // Define the sequence of operations for the RAG chain
  const ragChain = RunnableSequence.from([
    RunnablePassthrough.assign(assignedStandaloneQuestion),
    RunnablePassthrough.assign(assignedContext),
    prompt,
    model,
    new StringOutputParser()
  ] as any);

  // Define the directory for chat history
  const chatHistoryDir = path.join(__dirname, '../../data/chat');

  // Initialize the RAG chain with message history
  const ragChainWithHistory = new RunnableWithMessageHistory({
    runnable: ragChain,
    getMessageHistory: (sessionId) =>
      new JSONChatHistory({ sessionId, dir: chatHistoryDir }),
    historyMessagesKey: 'history',
    inputMessagesKey: 'question',
  });

  return ragChainWithHistory; // Return the RAG chain with history
}

// Main function to run the RAG chain
async function run() {
  const ragChain = await getRagChain(); // Get the RAG chain

  // Invoke the RAG chain with a question
  const res = await ragChain.invoke(
    {
        question: '什么是球状闪电？',
      // question: '这个现象在文中有什么故事',
    },
    {
      configurable: { sessionId: 'test-history' }, // Set the session ID for history
    }
  );

  console.log(res); // Log the response
}

run(); // Execute the main function

// testRephraseChain(); // Uncomment to test the rephrase chain