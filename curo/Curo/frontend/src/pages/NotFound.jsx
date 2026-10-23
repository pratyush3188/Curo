import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-6xl font-bold text-gray-800">404</h1>
      <p className="mt-4 text-xl text-gray-600">Page not found</p>
      <Link
        to="/"
        className="mt-6 inline-block px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        Return to Home
      </Link>
    </div>
  );
}
