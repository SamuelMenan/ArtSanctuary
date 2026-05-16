import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-sanctuary-bg">
      {/* Sidebar visible solo en lg+ */}
      <Sidebar />

      {/* Área principal */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Navbar visible en mobile y md; en lg se oculta porque el sidebar tiene el logo */}
        <div className="lg:hidden">
          <Navbar />
        </div>

        <main className="flex-1 px-4 sm:px-6 lg:px-10 py-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
