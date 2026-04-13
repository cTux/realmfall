declare module 'react-fps-stats' {
  import type { ComponentType } from 'react';

  interface FPSStatsProps {
    top?: string | number;
    right?: string | number;
    bottom?: string | number;
    left?: string | number;
    graphHeight?: string | number;
    graphWidth?: string | number;
  }

  const FPSStats: ComponentType<FPSStatsProps>;
  export default FPSStats;
}
