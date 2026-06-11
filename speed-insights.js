/**
 * Vercel Speed Insights Integration
 * This script injects the Speed Insights tracking for the static HTML site
 */

import { injectSpeedInsights } from '@vercel/speed-insights';

// Initialize Speed Insights
injectSpeedInsights({
  // Optional: set debug mode to true in development
  debug: false,
  // Optional: sample rate (1 = 100% of events)
  sampleRate: 1,
});
