import { NavBar } from "@/components/NavBar";
import { LeaderboardClient } from "./LeaderboardClient";

export const dynamic = "force-dynamic";

export default function LeaderboardPage() {
  return (
    <div className="min-h-dvh">
      <NavBar />
      <main>
        <LeaderboardClient />
      </main>
    </div>
  );
}
