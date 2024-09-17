import { NextRequest, NextResponse } from 'next/server';
import { GEval } from '@/src/metrics/GEval'; // Adjust the path to the correct location of the GEval class
import { LLMTestCase, LLMTestCaseParams, GEvalResponse } from '@/src/interfaces/interfaces';
import { GPTModel } from '@/src/models/GPTModel'; // Ensure correct path to GPTModel

// POST handler for GEval API
export async function POST(req: NextRequest) {
  try {
    // Parse the incoming request body
    const body = await req.json();

    // Destructure required fields from the request body
    const { name, input, actualOutput, expectedOutput, context, retrievalContext, criteria } = body;

    // Validate if required fields are present
    if (!name || !input || !actualOutput) {
      return NextResponse.json({ error: 'Missing required fields: name, input, or actualOutput' }, { status: 400 });
    }

    // Create a GPT model instance with the OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY || 'your-openai-api-key';
    const model = new GPTModel(apiKey);

    // Construct LLM test case based on the provided parameters
    const testCase: LLMTestCase = {
      input,
      actualOutput,
      expectedOutput: expectedOutput || '', // Fallback if not provided
      context: context || '', // Fallback if not provided
      retrievalContext: retrievalContext || '', // Fallback if not provided
    };

    // Define the evaluation parameters based on provided fields
    const evaluationParams: LLMTestCaseParams[] = [
      LLMTestCaseParams.INPUT,
      LLMTestCaseParams.ACTUAL_OUTPUT
    ];

    // Add optional parameters if present
    if (expectedOutput) evaluationParams.push(LLMTestCaseParams.EXPECTED_OUTPUT);
    if (context) evaluationParams.push(LLMTestCaseParams.CONTEXT);
    if (retrievalContext) evaluationParams.push(LLMTestCaseParams.RETRIEVAL_CONTEXT);

    // Instantiate the GEval metric (with criteria or other options)
    const gEval = new GEval(
      name, // Name of the evaluation (e.g., 'order_relevance', 'content_accuracy')
      evaluationParams, 
      criteria || null, // Optional criteria for evaluation
      null, // Optional evaluation steps
      model // GPTModel instance
    );

    // Perform asynchronous evaluation using the test case
    const {score, reason} = await gEval.aMeasure(testCase);
    console.log('GEval Score:', score);
    console.log('GEval Reason:', reason);

    // Build the response
    const response: GEvalResponse = {
      score,
      reason
    };

    // Return the GEval response as JSON
    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Error processing GEval request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to process GEval request', details: errorMessage }, { status: 500 });
  }
}
