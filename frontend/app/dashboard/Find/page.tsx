import { Suspense } from "react";
import { HackathonDirectory } from "@/components/hackathons/HackathonDirectory";

export default function Find() {
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-2xl font-bold sm:text-3xl">Find</h1>
            <Suspense fallback={<p className="mt-6 text-zinc-400">Loading hackathons…</p>}>
                <HackathonDirectory />
            </Suspense>
        </div>
    );
}
