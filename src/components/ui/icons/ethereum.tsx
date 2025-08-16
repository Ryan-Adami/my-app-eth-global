interface EthereumIconProps {
  className?: string;
}

export const EthereumIcon: React.FC<EthereumIconProps> = ({
  className = "",
}) => {
  return (
    <svg
      width="100"
      height="100"
      viewBox="60 20 115 195"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g>
        <path
          fill="currentColor"
          d="M117.5 25L117.5 89.4L171.1 116.4L117.5 25Z"
        />
        <path fill="currentColor" d="M117.5 25L63.9 116.4L117.5 89.4V25Z" />
        <path
          fill="currentColor"
          d="M117.5 157.6V210L171.2 127.4L117.5 157.6Z"
        />
        <path fill="currentColor" d="M117.5 210V157.6L63.9 127.4L117.5 210Z" />
        <path
          fill="currentColor"
          d="M117.5 149.1L171.1 118.9L117.5 91.9V149.1Z"
        />
        <path
          fill="currentColor"
          d="M63.9 118.9L117.5 149.1V91.9L63.9 118.9Z"
        />
      </g>
    </svg>
  );
};
