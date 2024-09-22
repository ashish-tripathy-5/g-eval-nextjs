import { BaseMetric } from '../metrics/BaseMetric';
import { Console } from 'console';

export async function metricProgressIndicator(
  metric: BaseMetric,
  asyncMode: boolean = true,
  showIndicator: boolean = true
): Promise<void> {
  const console = new Console(process.stderr); // Direct output to standard error
  if (showIndicator) {
    // Use the __name__ getter to access the metric name
    console.log(`Running ${metric.__name__} in async mode: ${asyncMode}`);
    // Simulate progress
    console.log('Processing...');
  }
  return new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate 1 second progress
}
