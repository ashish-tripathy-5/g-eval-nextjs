// src/models/BaseModel.ts

export abstract class DeepEvalBaseModel {
    model_name?: string;
  
    constructor(model_name?: string) {
      this.model_name = model_name;
    }
  
    // Abstract methods
    // abstract loadModel(...args: any[]): any;
  
    // abstract call(...args: any[]): any;
  }
  
  export abstract class DeepEvalBaseLLM extends DeepEvalBaseModel {
    //abstract generate(...args: any[]): string;
  
    abstract generate(...args: any[]): Promise<string>;
  }
  