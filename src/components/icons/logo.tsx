import type { SVGProps } from 'react';

export function TokoKilatLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width="40"
      height="40"
      {...props}
    >
      <g className="fill-primary transition-colors">
        <path d="M20,80 L20,30 Q20,20 30,20 L70,20 Q80,20 80,30 L80,80 Z" />
        <path d="M15,80 L85,80 L85,85 Q85,90 80,90 L20,90 Q15,90 15,85 Z" />
        <path d="M45,30 L55,30 L55,50 L65,50 L50,70 L35,50 L45,50 Z"  className="fill-primary-foreground transition-colors"/>
      </g>
    </svg>
  );
}
