import { Link } from "react-router";
import { Plane } from "lucide-react";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight">
      <span className="grid h-9 w-9 -rotate-6 place-items-center rounded-2xl bg-gradient-primary shadow-glow">
        <Plane className="h-4 w-4 text-primary-foreground" />
      </span>
      <span>Flight Price Notifier</span>
    </Link>
  );
}
