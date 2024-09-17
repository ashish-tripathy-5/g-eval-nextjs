export class ReasonScore {
    reason: string;
    score: number;
  
    constructor(reason: string, score: number) {
      this.reason = reason;
      this.score = score;
    }
  }
  
  export class Steps {
    steps: string[];
  
    constructor(steps: string[]) {
      this.steps = steps;
    }
  }
  