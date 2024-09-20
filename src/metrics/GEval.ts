import { BaseMetric } from '../metrics/BaseMetric';  
import { LLMTestCase, LLMTestCaseParams } from '../interfaces/interfaces';  
import { constructVerboseLogs, checkLLMTestCaseParams, initializeModel } from '../utils/metric-utils'; 
import { prettifyList, trimAndLoadJson }  from '@/src/utils/utils'; 
import { metricProgressIndicator } from '../utils/indicator';  
import { GEvalTemplate } from '../utils/GEvalTemplate';  
import { ReasonScore, Steps } from '../utils/schema';  
import GPTModel from '../models/GPTModel'; 

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
    model: GPTModel | null = null,  
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

    // Initialize the GPT model
    this.model = model || new GPTModel("your-openai-api-key", "gpt-4o-mini");
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
    const { score, reason } = await this._aEvaluate(testCase);

    this.score = score / 10;
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
      reason: this.reason || 'No reason provided',
    };
  }

  // Asynchronous evaluation step generator
  private async _aGenerateEvaluationSteps(): Promise<string[]> {
    if (this.evaluationSteps) {
      return this.evaluationSteps;
    }

    const gEvalParamsStr = constructGEvalParamsString(this.evaluationParams);
    const prompt = GEvalTemplate.generateEvaluationSteps(this.criteria ?? '', gEvalParamsStr);

    const result = await this.model?.generate(prompt, ''); 
    if (!result) {
      throw new Error("Failed to generate evaluation steps");
    }
    const data = trimAndLoadJson(result);
    return data.steps;
  }

  // Generate weighted summed score function (convert from Python)
  private generateWeightedSummedScore(rawScore: number, rawResponse: any): number {
    try {
      // Ensure we are accessing the logprobs correctly
      const generatedLogprobs = rawResponse?.logprobResult?.content;
      if (!Array.isArray(generatedLogprobs)) {
        throw new Error("Expected generatedLogprobs to be an array.");
      }
  
      // Instead of using .find(), manually iterate through the logprobs and find the matching token
      let scoreToken: any = null;
      for (const tokenLogprobs of generatedLogprobs) {
        if (tokenLogprobs.token === rawScore.toString()) {
          scoreToken = tokenLogprobs;
          break;
        }
      }
  
      if (!scoreToken) {
        throw new Error("Matching token for the raw score not found.");
      }
  
      const tokenLinearProbability: Record<number, number> = {};
      let sumLinearProbability = 0;
      const minLogprob = Math.log(0.01);
  
      for (const tokenLogprob of scoreToken.top_logprobs) {
        const logprob = tokenLogprob.logprob;
        const token = tokenLogprob.token;
  
        // Skip low-probability tokens and non-numeric tokens
        if (logprob < minLogprob || isNaN(Number(token))) {
          continue;
        }
  
        const linearProb = Math.exp(logprob);
        const tokenScore = parseInt(token, 10);
  
        // Accumulate linear probabilities and their associated scores
        tokenLinearProbability[tokenScore] = (tokenLinearProbability[tokenScore] || 0) + linearProb;
        sumLinearProbability += linearProb;
      }
  
      let sumOfWeightedScores = 0;
      for (const [score, prob] of Object.entries(tokenLinearProbability)) {
        sumOfWeightedScores += parseFloat(score) * prob;
      }
  
      // Return the weighted summed score
      return sumOfWeightedScores / sumLinearProbability;
    } catch (error) {
      console.error("Error generating weighted summed score:", error);
      throw new Error("Failed to generate weighted summed score");
    }
  }
  

  // Asynchronous evaluation
  private async _aEvaluate(testCase: LLMTestCase): Promise<{ score: number; reason: string }> {
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

    try {
      const result = await this.model?.generateRawResponse(prompt,'', true, 20 );
      const data = trimAndLoadJson(result?.content ?? '');
      

      const reason = data.reason;
      const score = data.score;
      console.log("wo score", score);
      console.log("wo reason", reason);

      if (this.strictMode) {
        return { score, reason };
      }
      

      try {
        const weightedSummedScore = this.generateWeightedSummedScore(score, result);
        console.log("w score", weightedSummedScore);
        console.log("w reason", reason);
        return { score: weightedSummedScore, reason };
      } catch (e) {
        return { score, reason };
      }
    } catch (error) {
      console.error("Error during evaluation:", error);

      const fallbackResult = await this.model?.generate(prompt, '') ?? '';
      const data = trimAndLoadJson(fallbackResult);
      return { score: data.score, reason: data.reason };
    }
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
