import { Outlet } from 'react-router-dom';
import Sidebar from './sidebar';
import Header from './header';

export default function Layout() {
  return (
    <div className="relative flex h-screen overflow-hidden">
      <div className="orb orb-orange" />
      <div className="orb orb-amber" />
      <div className="orb orb-center" />
      <Sidebar />
      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
