interface ModeIconProps {
  className?: string;
}

export const ModeIcon: React.FC<ModeIconProps> = ({ className = "" }) => {
  return (
    <svg
      width="100"
      height="100"
      viewBox="200 200 600 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M784.2,750.7H673.3V500l44.4-143l-31.5-11.2L542.4,750.7H458L314.1,345.8L282.7,357l44.4,143v250.8H216.2V247.6h165.1l102.4,288v84.6h33.5v-84.6l102.4-288h165.1v503.1H784.2z"
        fill="currentColor"
      />
    </svg>
  );
};
