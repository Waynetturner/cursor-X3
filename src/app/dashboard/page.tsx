import AppLayout from '@/components/layout/AppLayout';

export default function DashboardPage() {
  return (
    <AppLayout title="Dashboard">
      <div className="p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        </header>
        <main>
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-white/10 backdrop-blur-lg text-white border border-white/20 rounded-2xl p-8">
              <h2 className="text-2xl font-bold mb-4">Dashboard Coming Soon</h2>
              <p className="text-lg opacity-80">Your workout dashboard will be available here soon.</p>
            </div>
          </div>
        </main>
      </div>
    </AppLayout>
  );
} 