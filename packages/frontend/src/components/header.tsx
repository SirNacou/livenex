/**
 * Header component
 */
export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Livenex</h1>
        <p className="text-sm text-gray-600">Uptime monitoring for your personal infrastructure</p>
      </div>
    </header>
  );
}
