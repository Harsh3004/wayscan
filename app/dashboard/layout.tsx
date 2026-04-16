import { Sidebar } from "./_components/Sidebar";
import { Topbar } from "./_components/Topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0B1120] text-white">
      <Sidebar />

      <div className="md:pl-72">
        <Topbar />
        <main className="mx-auto w-full max-w-[1280px] px-6 py-10">{children}</main>
      </div>
    </div>
  );
}

