// src/utils/utils.ts

import { v4 as uuidv4 } from 'uuid'; // for UUID generation

// Trim and load JSON from a string
export function trimAndLoadJson(inputString: string): any {
  const start = inputString.indexOf('{');
  const end = inputString.lastIndexOf('}') + 1;
  
  if (start === -1 || end === 0) {
    throw new Error('Invalid JSON format');
  }
  
  const jsonStr = inputString.slice(start, end);
  return JSON.parse(jsonStr);
}

// Generate UUID
export function generateUUID(): string {
  return uuidv4();
}

// Convert camelCase to snake_case
export function camelToSnake(name: string): string {
  return name.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

// Prettify list into string
export function prettifyList(items: string[]): string {
  return items.map((item, index) => `${index + 1}. ${item}`).join('\n');
}

// Get or create event loop
export function getOrCreateEventLoop(): void {
    try {
      const loop = process.nextTick; // This doesn't actually return an EventLoop, so no need to return anything
      return;
    } catch (error) {
      const newLoop = setImmediate;
      return;
    }
  }
