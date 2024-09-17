// src/interfaces/interfaces.ts

// GEvalResponse interface for returning the result of the evaluation
export interface GEvalResponse {
    score: number;
    reason: string;
  }
  
  // Enum for LLM test case parameters
  // Enum for LLM test case parameters
export enum LLMTestCaseParams {
  INPUT = "input",
  ACTUAL_OUTPUT = "actualOutput",
  EXPECTED_OUTPUT = "expectedOutput",
  CONTEXT = "context",
  RETRIEVAL_CONTEXT = "retrievalContext",
}

  
  // Interface for the LLM test case
  export interface LLMTestCase {
    input: string;
    actualOutput: string;
    expectedOutput: string;
    context?: string;
    retrievalContext?: string;
  }
  
  // Interface for the ConversationalTestCase used in conversational evaluations
  export interface ConversationalTestCase {
    conversationHistory: string[];
    expectedOutput: string;
    actualOutput: string;
  }
  
  // Interface for Steps used in GEval evaluation steps
  export interface Steps {
    steps: string[];
  }
  
  // Interface for ReasonScore for evaluation results
  export interface ReasonScore {
    score: number;
    reason: string;
  }
  