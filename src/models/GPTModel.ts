import OpenAI from 'openai';

export class GPTModel {
  private openai: OpenAI;
  private _model: string;

  constructor(apiKey: string, model: string = "gpt-4o") {
    // Initialize the OpenAI client with the provided API key
    this.openai = new OpenAI({ apiKey });
    this._model = model;
  }

  // Getter to access the model property
  public get model(): string {
    return this._model;
  }

  async generate(finalSystemPrompt: string, userPrompt: string): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: this._model,
        messages: [
          { role: 'system', content: finalSystemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      });

      const result = completion.choices[0]?.message?.content?.trim();
      console.log("Raw result from OpenAI:", result);

      if (!result) {
        throw new Error("No content received from the model");
      }

      return result;

    } catch (error) {
      throw new Error(`Error generating response: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export default GPTModel;
