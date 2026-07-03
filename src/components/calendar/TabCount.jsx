const TONE_CLASSES = {
  primary: "bg-primary text-primary-foreground",
  success: "bg-success text-white",
  destructive: "bg-destructive text-white",
};

function TabCount({ count, tone = "primary" }) {
  if (count <= 0) return null;

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 font-display text-[11px] font-semibold rounded-full ${TONE_CLASSES[tone]}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default TabCount;
