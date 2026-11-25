import { ArrowLeft, Home } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-2xl font-black text-white">404</div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Page not found</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">We can't find that page</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
          The page may have moved, been removed, or the URL may be incorrect.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/dashboard" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800">
            <Home className="h-4 w-4" /> Dashboard
          </Link>
          <button onClick={() => navigate(-1)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <ArrowLeft className="h-4 w-4" /> Go back
          </button>
        </div>
      </div>
    </div>
  );
}
