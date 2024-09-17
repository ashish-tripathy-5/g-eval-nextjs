import { BaseMetric } from '../metrics/BaseMetric';  // Assuming BaseMetric is in the metrics folder
import { LLMTestCase, LLMTestCaseParams } from '../interfaces/interfaces';  // Assuming test_case module exports LLMTestCase and LLMTestCaseParams
import { constructVerboseLogs, checkLLMTestCaseParams, initializeModel } from '../utils/metric-utils'; 
import { prettifyList, trimAndLoadJson }  from '@/src/utils/utils'; // Import utility functions
import { metricProgressIndicator } from '../utils/indicator';  // Progress indicator
import { GEvalTemplate } from '../utils/GEvalTemplate';  // GEval template handling
import { ReasonScore, Steps } from '../utils/schema';  // Schema models for response handling
import GPTModel from '../models/GPTModel'; // Import the GPTModel

const G_EVAL_PARAMS: Record<string, string> = {
  input: "Input",
  actualOutput: "Actual Output",
  expectedOutput: "Expected Output",
  context: "Context",
  retrievalContext: "Retrieval Context"
};

// Helper function to construct g-eval parameter string
function constructGEvalParamsString(llmTestCaseParams: LLMTestCaseParams[]): string {
  const gEvalParams = llmTestCaseParams.map(param => param);
  if (gEvalParams.length === 1) {
    return gEvalParams[0];
  } else if (gEvalParams.length === 2) {
    return gEvalParams.join(" and ");
  } else {
    return `${gEvalParams.slice(0, -1).join(", ")}, and ${gEvalParams[gEvalParams.length - 1]}`;
  }
}

// Define the GEval class
export class GEval extends BaseMetric {
  name: string;
  evaluationParams: LLMTestCaseParams[];
  criteria: string | null;
  evaluationSteps: string[] | null;
  model: GPTModel | null;  // Using GPTModel here
  threshold: number;
  strictMode: boolean;
  asyncMode: boolean;
  verboseMode: boolean;
  evaluationModel: string;
  score: number | null = null;
  reason: string | null = null;
  evaluationCost: number | null = null;
  _includeGEvalSuffix: boolean;

  constructor(
    name: string,
    evaluationParams: LLMTestCaseParams[],
    criteria: string | null = null,
    evaluationSteps: string[] | null = null,
    model: GPTModel | null = null,  // GPTModel in use
    threshold: number = 0.5,
    asyncMode: boolean = true,
    strictMode: boolean = false,
    verboseMode: boolean = false,
    includeGEvalSuffix: boolean = true
  ) {
    super();
    this.name = name;
    this.evaluationParams = evaluationParams;
    this.criteria = criteria;
    this.evaluationSteps = evaluationSteps;
    this.threshold = threshold;
    this.strictMode = strictMode;
    this.asyncMode = asyncMode;
    this.verboseMode = verboseMode;
    this._includeGEvalSuffix = includeGEvalSuffix;

    // Initialize the GPT model (You can pass your API key here)
    this.model = model || new GPTModel("your-openai-api-key", "gpt-4o");
    this.evaluationModel = this.model ? this.model.model : 'unknown';
  }

  // Asynchronous measure implementation
  async aMeasure(testCase: LLMTestCase, showIndicator: boolean = true): Promise<{ score: number; reason: string }> {
    checkLLMTestCaseParams(testCase, this.evaluationParams, this);

    this.evaluationCost = 0;
    if (showIndicator) {
      await metricProgressIndicator(this, this.asyncMode, showIndicator);
    }

    this.evaluationSteps = this.evaluationSteps || await this._aGenerateEvaluationSteps();
    const [gScore, reason] = await this._aEvaluate(testCase);

    this.score = gScore / 10;
    this.reason = reason;
    this.score = this.strictMode && this.score < this.threshold ? 0 : this.score;
    this.success = this.score >= this.threshold;

    this.verboseLogs = constructVerboseLogs(
      this,
      [
        `Evaluation Steps:\n${prettifyList(this.evaluationSteps ?? [])}`,
        `Score: ${this.score}\nReason: ${this.reason}`,
      ]
    );

    return {
      score: this.score,
      reason: this.reason || 'No reason provided', // Provide a default reason if undefined
    };
  }

  // Asynchronous evaluation step generator
  private async _aGenerateEvaluationSteps(): Promise<string[]> {
    if (this.evaluationSteps) {
      return this.evaluationSteps;
    }

    const gEvalParamsStr = constructGEvalParamsString(this.evaluationParams);
    const prompt = GEvalTemplate.generateEvaluationSteps(this.criteria ?? '', gEvalParamsStr);

    const result = await this.model?.generate(prompt, ''); // User prompt can be passed here
    if (!result) {
      throw new Error("Failed to generate evaluation steps");
    }
    const data = trimAndLoadJson(result);
    return data.steps;
  }

  // Asynchronous evaluation
  private async _aEvaluate(testCase: LLMTestCase): Promise<[number, string]> {
    let text = '';
    this.evaluationParams.forEach(param => {
      text += `${G_EVAL_PARAMS[param]}:\n${(testCase as any)[param]} \n\n`;
    });

    const gEvalParamsStr = constructGEvalParamsString(this.evaluationParams);
    const prompt = GEvalTemplate.generateEvaluationResults(
      this._numberEvaluationSteps(),
      text,
      gEvalParamsStr
    );
    console.log("Constructed prompt:", prompt);

    const result = await this.model?.generate(prompt, '');  // User prompt can be passed here
    if (!result) {
      throw new Error("Failed to generate evaluation results");
    }
    const data = trimAndLoadJson(result);
    console.log("Parsed OpenAI response:", data);

    return [data.score, data.reason];
  }

  // Helper method to generate numbered evaluation steps
  private _numberEvaluationSteps(): string {
    return this.evaluationSteps!.map((step, index) => `${index + 1}. ${step}`).join("\n");
  }

  // Determine success
  isSuccessful(): boolean {
    return this.success ?? false;
  }

  // Property getter for name, optionally adding GEval suffix
  get __name(): string {
    return this._includeGEvalSuffix ? `${this.name} (GEval)` : this.name;
  }
}
