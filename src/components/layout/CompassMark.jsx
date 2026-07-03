function CompassMark({ className }) {
  return (
    <svg
      viewBox="0 0 34 34"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="17" cy="17" r="15" stroke="currentColor" strokeWidth="1.4" />
      <line x1="17" y1="2" x2="17" y2="8" stroke="currentColor" strokeWidth="1.4" />
      <line x1="17" y1="26" x2="17" y2="32" stroke="currentColor" strokeWidth="1.4" />
      <line x1="2" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="1.4" />
      <line x1="26" y1="17" x2="32" y2="17" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="17" cy="17" r="2.4" fill="currentColor" />
      <line x1="17" y1="17" x2="24" y2="10" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export default CompassMark;
