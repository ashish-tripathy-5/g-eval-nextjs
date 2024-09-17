import { LLMTestCase, LLMTestCaseParams } from '../interfaces/interfaces';
import { BaseMetric } from '../metrics/BaseMetric';
import { DeepEvalBaseLLM} from '../models/BaseModel'; 
import { GPTModel } from '../models/GPTModel'

// Copy metrics
export function copyMetrics(metrics: BaseMetric[]): BaseMetric[] {
  return metrics.map(metric => {
    const newMetric = Object.create(Object.getPrototypeOf(metric), Object.getOwnPropertyDescriptors(metric));
    return newMetric as BaseMetric;
  });
}

// Process LLM test cases
export function processLLMTestCases(llmTestCases: LLMTestCase[], testCaseParams: LLMTestCaseParams[]): Record<string, string>[] {
  return llmTestCases.map((testCase) => {
    const result: Record<string, string> = {};
    testCaseParams.forEach((param) => {
      const value = (testCase as any)[param];
      if (value) result[param] = value;
    });
    return result;
  });
}

// Construct verbose logs for metrics
export function constructVerboseLogs(metric: BaseMetric, steps: string[]): string {
  let verboseLogs = steps.slice(0, -1).join(" \n \n");
  verboseLogs += `\n \n${steps[steps.length - 1]}`;
  
  if (metric.verboseMode) {
    console.log(`Logs for metric ${metric.__name__}:\n${verboseLogs}`);
  }
  
  return verboseLogs;
}

// Check LLM test case params
export function checkLLMTestCaseParams(testCase: LLMTestCase, requiredParams: LLMTestCaseParams[], metric: BaseMetric): void {
  requiredParams.forEach((param) => {
    if (!(param in testCase)) {
      throw new Error(`Missing parameter: ${param}`);
    }
  });
}

// Define InitializedModelResult as a tuple
type InitializedModelResult = [DeepEvalBaseLLM, boolean];

export function initializeModel(
  model: string | DeepEvalBaseLLM | GPTModel | null = null
): InitializedModelResult {
  /**
   * Returns a tuple of (initialized DeepEvalBaseLLM, using_native_model boolean)
   */

  // Check if the model is already a GPTModel
  if (model instanceof GPTModel) {
    return [model, true]; // If it's a GPTModel, it's using a native model
  }

  // Check if the model is an instance of DeepEvalBaseLLM, but not a GPTModel
  if (model instanceof DeepEvalBaseLLM) {
    return [model, false]; // It's a DeepEvalBaseLLM, not a GPTModel
  }

  // Otherwise, the model is either a string or null, so we initialize a new GPTModel
  return [new GPTModel(model as string | ""), true];
}
