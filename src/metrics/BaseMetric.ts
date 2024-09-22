// src/metrics/BaseMetric.ts

import { LLMTestCase } from '../interfaces/interfaces';

abstract class BaseMetric {
    threshold: number = 0.5;
    score: number | null = null;
    scoreBreakdown: Record<string, unknown> | null = null;
    reason: string | null = null;
    success: boolean | null = null;
    evaluationModel: string | null = null;
    strictMode: boolean = false;
    asyncMode: boolean = true;
    verboseMode: boolean = true;
    includeReason: boolean = false;
    error: string | null = null;
    evaluationCost: number | null = null;
    verboseLogs: string | null = null;
  
    // Abstract methods to be implemented by subclasses
    // abstract measure(testCase: LLMTestCase, ...args: any[]): number;
    abstract aMeasure(testCase: LLMTestCase, showIndicator?: boolean): Promise<{ score: number; reason: string }>;
    abstract isSuccessful(): boolean;
  
    // Get the name of the class (metric type)
    get __name__(): string {
      return 'Base Metric';
    }
  }

  export { BaseMetric }
