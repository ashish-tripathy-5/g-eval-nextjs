// src/utils/GEvalTemplate.ts

export class GEvalTemplate {
    // Generates evaluation steps based on parameters and criteria
    static generateEvaluationSteps(parameters: string, criteria: string): string {
      return `
        Given an evaluation criteria which outlines how you should judge the ${parameters}, 
        generate 3-4 concise evaluation steps based on the criteria below. 
        You MUST make it clear how to evaluate ${parameters} in relation to one another.
  
        Evaluation Criteria:
        ${criteria}
  
        **
        IMPORTANT: Please make sure to only return in JSON format, with the "steps" key as a list of strings. 
        No words or explanation is needed.
        Example JSON:
        {
          "steps": <list_of_strings>
        }
        **
  
        JSON:
      `;
    }
  
    // Generates evaluation results based on steps, text, and parameters
    static generateEvaluationResults(evaluationSteps: string, text: string, parameters: string): string {
      return `
        Given the evaluation steps, return a JSON with two keys: 
        1) a \`score\` key ranging from 0 - 10, with 10 being that it follows the criteria outlined in the steps 
        and 0 being that it does not, and 
        2) a \`reason\` key, a reason for the given score, but DO NOT QUOTE THE SCORE in your reason. 
        Please mention specific information from ${parameters} in your reason, but be very concise with it!
  
        Evaluation Steps:
        ${evaluationSteps}
  
        ${text}
  
        **
        IMPORTANT: Please make sure to only return in JSON format, with the "score" and "reason" key. 
        No words or explanation is needed.
  
        Example JSON:
        {
          "score": 0,
          "reason": "The text does not follow the evaluation steps provided."
        }
        **
  
        JSON:
      `;
    }
  }
  