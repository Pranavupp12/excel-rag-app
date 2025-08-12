// services/ragService.js
const xlsx = require('xlsx');
const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { Document } = require("langchain/document");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { createStuffDocumentsChain } = require("langchain/chains/combine_documents");
const { createRetrievalChain } = require("langchain/chains/retrieval");
const { RunnableSequence } = require("@langchain/core/runnables");
const { StringOutputParser } = require("@langchain/core/output_parsers");

const { OllamaEmbeddings } = require("@langchain/community/embeddings/ollama");
const { ChatGroq } = require("@langchain/groq");

let vectorStore;

//first llm for extracting and providiing the answer
// This prompt is designed to extract relevant information from the calendar context
const promptTemplate = ChatPromptTemplate.fromMessages([
    ["system", 
        "You are an expert on the company's monthly calendar and reference links. " +
        "You will be provided with context from the calendar in a structured format. " +
        "Your task is to answer the user's question accurately and concisely based ONLY on this context.\n\n" +
        "Before giving an answer, you MUST verify that the 'Date' in the context is a exact and perfect match for the date in the user's question, even if the formats are different (e.g., 'august 16th' should match '8/16/25'). " +
        "If a 'Reference Link' is present, you MUST provide the full URL in your answer. " +
        "If any header as has empty value you dont have to fill in on our own just simply give empty value "+
        "If the answer cannot be found or the dates do not match, politely state that the information is not available and do not make anything up.\n\n" +
        "Context:\n" +
        "{context}"
    ],
    ["user", "{input}"]
]);
//second ll for formatting the answer
// This prompt is designed to take the original answer and format it into a more human-readable structure
const humanizePromptTemplate = ChatPromptTemplate.fromMessages([
    ["system", 
        "You are a helpful assistant. Your task is to take the provided calendar information, which may contain multiple entries, and extract ONLY the first entry. You must then format this information as a single, cohesive block of text. Start the output with the Date and Day from the context on a single line. Then, create a bulleted list for all other headers and their corresponding information. Do not add any extra headers or conversational text. Use only the information provided in the context.\n\n" +
        "Original Answer:\n" +
        "{original_answer}"
    ],
    ["user", "Please provide the information for the first date."]
]);

const processExcelFile = async (fileBuffer) => {
    const workbook = xlsx.read(fileBuffer, { type: 'buffer', cellDates: true });
    let documents = [];

    for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        
        // Use sheet_to_json with defval to ensure all rows are captured
        const jsonData = xlsx.utils.sheet_to_json(worksheet, { 
            header: 1, 
            raw: false, 
            defval: '' 
        });

        // Get header row dynamically from the processed JSON data
        if (jsonData.length === 0) continue;
        const headerRow = Object.keys(jsonData[0]);
        
        for (const row of jsonData) {
            let metadata = {};
            let pageContentParts = [];
            let rowHasData = false;

            for (const header of headerRow) {
                const value = row[header];

                if (value !== '') {
                    rowHasData = true;
                }
                metadata[header] = value;
                pageContentParts.push(`${header}: ${value}`);
            }
            
            if (rowHasData) {
                const pageContent = pageContentParts.join(' | ');
                documents.push(new Document({
                    pageContent: pageContent,
                    metadata: metadata 
                }));
            }
        }
    }

     // Add the log to check the number of documents ---
    console.log(`Successfully created ${documents.length} documents from the Excel file.`);

    const embeddings = new OllamaEmbeddings({
        model: "nomic-embed-text",
        baseUrl: "http://localhost:11434"
    });
    
    vectorStore = await MemoryVectorStore.fromDocuments(documents, embeddings);
};




// Date normalization function to convert various date formats to MM/DD/YYYY
const normalizeDateInQuery = (query) => {
    // Define regex patterns for different date formats
    const datePatterns = [
        // Month names (full and abbreviated) with day and year
        {
            pattern: /\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|october|oct|november|nov|december|dec)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4}|\d{2})\b/gi,
            handler: (match, month, day, year) => {
                const monthMap = {
                    'january': '01', 'jan': '01',
                    'february': '02', 'feb': '02',
                    'march': '03', 'mar': '03',
                    'april': '04', 'apr': '04',
                    'may': '05',
                    'june': '06', 'jun': '06',
                    'july': '07', 'jul': '07',
                    'august': '08', 'aug': '08',
                    'september': '09', 'sep': '09',
                    'october': '10', 'oct': '10',
                    'november': '11', 'nov': '11',
                    'december': '12', 'dec': '12'
                };
                const normalizedMonth = monthMap[month.toLowerCase()];
                const normalizedDay = day.padStart(2, '0');
                const normalizedYear = year.length === 2 ? `20${year}` : year;
                return `${normalizedMonth}/${normalizedDay}/${normalizedYear}`;
            }
        },
        // DD/MM/YYYY or DD-MM-YYYY format
        {
            pattern: /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/g,
            handler: (match, first, second, year) => {
                // Assume MM/DD/YYYY format (US standard)
                const month = first.padStart(2, '0');
                const day = second.padStart(2, '0');
                return `${month}/${day}/${year}`;
            }
        },
        // YYYY-MM-DD format (ISO)
        {
            pattern: /\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/g,
            handler: (match, year, month, day) => {
                const normalizedMonth = month.padStart(2, '0');
                const normalizedDay = day.padStart(2, '0');
                return `${normalizedMonth}/${normalizedDay}/${year}`;
            }
        },
        // Month DD format (current year assumed)
        {
            pattern: /\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|october|oct|november|nov|december|dec)\s+(\d{1,2})(?:st|nd|rd|th)?\b/gi,
            handler: (match, month, day) => {
                const monthMap = {
                    'january': '01', 'jan': '01',
                    'february': '02', 'feb': '02',
                    'march': '03', 'mar': '03',
                    'april': '04', 'apr': '04',
                    'may': '05',
                    'june': '06', 'jun': '06',
                    'july': '07', 'jul': '07',
                    'august': '08', 'aug': '08',
                    'september': '09', 'sep': '09',
                    'october': '10', 'oct': '10',
                    'november': '11', 'nov': '11',
                    'december': '12', 'dec': '12'
                };
                const normalizedMonth = monthMap[month.toLowerCase()];
                const normalizedDay = day.padStart(2, '0');
                const currentYear = new Date().getFullYear();
                return `${normalizedMonth}/${normalizedDay}/${currentYear}`;
            }
        },
        // MM/DD format (current year assumed)
        {
            pattern: /\b(\d{1,2})[\/\-](\d{1,2})\b/g,
            handler: (match, month, day) => {
                const normalizedMonth = month.padStart(2, '0');
                const normalizedDay = day.padStart(2, '0');
                const currentYear = new Date().getFullYear();
                return `${normalizedMonth}/${normalizedDay}/${currentYear}`;
            }
        }
    ];

    let normalizedQuery = query;

    // Apply each pattern to normalize dates
    datePatterns.forEach(({ pattern, handler }) => {
        normalizedQuery = normalizedQuery.replace(pattern, handler);
    });

    return normalizedQuery;
};



const getAnswer = async (query) => {
    if (!vectorStore) {
        return null;
    }

    // --- MISSING PART: Call the date normalization function
    const preprocessedQuery = normalizeDateInQuery(query);

    const model = new ChatGroq({
        model: "llama3-8b-8192",
        temperature: 0.1,
        apiKey: process.env.GROQ_API_KEY,
    });
    
    const retriever = vectorStore.asRetriever({ k: 50 });

    const combineDocsChain = await createStuffDocumentsChain({
        llm: model,
        prompt: promptTemplate,
    });

    const retrievalChain = await createRetrievalChain({
        retriever,
        combineDocsChain,
    });
    
    // --- STEP 1: Get the full, unfiltered answer from the first chain ---
    const firstResult = await retrievalChain.invoke({ input: preprocessedQuery });

  // Step 2: Create a second prompt and chain
    const humanizeChain = RunnableSequence.from([
        humanizePromptTemplate,
        model,
        new StringOutputParser(),
    ]);

    // Step 3: Pass the first answer directly to the second chain
    const finalAnswer = await humanizeChain.invoke({
        original_answer: firstResult.answer,
    });

    return finalAnswer;
};

module.exports = {
    processExcelFile,
    getAnswer
};




