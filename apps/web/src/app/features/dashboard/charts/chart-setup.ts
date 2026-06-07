import {
    Chart,
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    TimeScale,
    Tooltip,
    Legend,
    Filler,
    DoughnutController,
    ArcElement,
  } from 'chart.js';
  
  let registered = false;
  
  /**
   * Registers only the Chart.js components we actually use.
   * Called lazily on first chart render to keep the initial bundle small.
   */
  export function registerChartComponents(): void {
    if (registered) return;
  
    Chart.register(
      // Line chart
      LineController,
      LineElement,
      PointElement,
      LinearScale,
      CategoryScale,
      TimeScale,
      Filler,
      // Donut chart
      DoughnutController,
      ArcElement,
      // Shared
      Tooltip,
      Legend,
    );
  
    // Global defaults that match our dark theme
    Chart.defaults.color = '#a1a1aa';
    Chart.defaults.borderColor = '#27272a';
    Chart.defaults.font.family = "Inter, -apple-system, BlinkMacSystemFont, sans-serif";
  
    registered = true;
  }