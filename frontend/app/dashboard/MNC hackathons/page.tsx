import { Suspense } from "react";
import { HackathonDirectory } from "@/components/hackathons/HackathonDirectory";

export default function MNCHackathons() {
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl font-bold sm:text-3xl">MNC Hackathons</h1>
            <p className="mt-2 text-sm text-zinc-400">Explore corporate challenges and register on the official event website.</p>
            <Suspense fallback={<p className="mt-6 text-zinc-400">Loading hackathons…</p>}>
                <HackathonDirectory mncOnly />
            </Suspense>
        </div>
    );
}
