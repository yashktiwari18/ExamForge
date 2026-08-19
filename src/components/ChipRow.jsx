export default function ChipRow({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`ef-chip px-3 py-1.5 rounded-full text-xs sm:text-sm ${value === opt ? "ef-chip-active" : ""}`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
