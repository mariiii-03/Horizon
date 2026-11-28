import { Suspense } from "react";
import { LoadingPanel } from "@/components/ui/ObservatoryPrimitives";
import { SolarSystemWorkspace } from "@/features/solar-system/components/SolarSystemWorkspace";

export default function SolarSystemPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8">
          <LoadingPanel height="h-[560px]" lines={5} />
        </main>
      }
    >
      <SolarSystemWorkspace />
    </Suspense>
  );
}
