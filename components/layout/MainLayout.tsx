import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background print:h-auto print:overflow-visible print:bg-white print:block">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden print:h-auto print:overflow-visible print:block">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 print:h-auto print:overflow-visible print:p-0 print:block">
          {children}
        </main>
      </div>
    </div>
  );
}
