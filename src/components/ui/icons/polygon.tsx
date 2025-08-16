interface PolygonIconProps {
  className?: string;
}

export const PolygonIcon: React.FC<PolygonIconProps> = ({ className = "" }) => {
  return (
    <svg
      width="100"
      height="100"
      viewBox="80 90 200 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M218.804 99.5819L168.572 128.432V218.473L140.856 234.539L112.97 218.46V186.313L140.856 170.39L158.786 180.788V154.779L140.699 144.511L90.4795 173.687V231.399L140.869 260.418L191.088 231.399V141.371L218.974 125.291L246.846 141.371V173.374L218.974 189.597L200.887 179.107V204.986L218.804 215.319L269.519 186.47V128.432L218.804 99.5819Z"
        fill="currentColor"
      />
    </svg>
  );
};
