import Link from 'next/link';

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-4 text-center">
        <h1 className="text-3xl font-bold text-red-600">Authentication Error</h1>
        <p className="text-gray-600">
          An error occurred during the authentication process. Please try again.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}

