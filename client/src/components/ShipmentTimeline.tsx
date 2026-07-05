import type { ShipmentStatus } from "../types";

const STEPS: { status: ShipmentStatus; label: string }[] = [
  { status: "requested", label: "Requested" },
  { status: "loading", label: "Loading" },
  { status: "in_transit", label: "In transit" },
  { status: "delivered", label: "Delivered" },
];

export default function ShipmentTimeline({ status }: { status: ShipmentStatus }) {
  const current = STEPS.findIndex((s) => s.status === status);

  return (
    <ol className="flex">
      {STEPS.map((step, i) => {
        const reached = i <= current;
        const active = i === current;
        return (
          <li key={step.status} className="relative flex flex-1 flex-col items-center">
            {i > 0 && (
              <span
                aria-hidden
                className={`absolute right-1/2 top-[4px] h-px w-full ${
                  reached ? "bg-flare/60" : "bg-seam"
                }`}
              />
            )}
            <span
              className={`relative z-10 h-2 w-2 rounded-full border ${
                active
                  ? "border-flare bg-flare shadow-[0_0_0_3px_rgba(255,107,44,0.25)]"
                  : reached
                    ? "border-flare/60 bg-flare/60"
                    : "border-seam bg-hull"
              }`}
            />
            <span
              className={`mt-1.5 text-[9px] uppercase tracking-widest ${
                active ? "text-paper" : "text-fog"
              }`}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
