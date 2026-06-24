import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-lg text-center">
        <h1 className="text-2xl font-bold text-red-600">Errore di Autenticazione</h1>
        <p className="mt-2 text-gray-600">
          Si è verificato un errore durante il login. Riprova.
        </p>
        <Link
          href="/auth/login"
          className="mt-8 inline-block rounded-lg bg-blue-600 px-6 py-2 text-white font-medium hover:bg-blue-700"
        >
          Torna al Login
        </Link>
      </div>
    </div>
  );
}
