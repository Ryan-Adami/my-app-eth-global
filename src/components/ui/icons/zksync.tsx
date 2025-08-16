interface ZkSyncIconProps {
  className?: string;
}

export const ZkSyncIcon: React.FC<ZkSyncIconProps> = ({ className = "" }) => {
  return (
    <svg
      viewBox="0 0 41.66 23.55"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        className="primary"
        fillRule="evenodd"
        d="M41.66,11.78L29.84,0V8.63L18.11,17.26H29.84v6.28Z"
        fill="currentColor"
      />
      <path
        className="secondary"
        fillRule="evenodd"
        d="M0,11.77L11.82,23.55V15L23.55,6.29H11.82V0Z"
        fill="currentColor"
      />
    </svg>
  );
};
