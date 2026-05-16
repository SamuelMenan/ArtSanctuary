import Link from "next/link";

export const metadata = {
  title: "Iniciar sesión",
  description: "Accede a tu cuenta de ArtSanctuary.",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-sanctuary-bg px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-serif text-sanctuary-accent">Art</span>
            <span className="text-2xl font-serif text-sanctuary-text">Sanctuary</span>
          </Link>
          <p className="font-mono text-xs text-sanctuary-muted mt-2 tracking-wide">
            Tu santuario creativo
          </p>
        </div>

        {/* Form */}
        <div className="rounded-[var(--radius-card)] bg-sanctuary-surface border border-sanctuary-border p-6">
          <h1 className="text-xl font-serif text-sanctuary-text mb-6 text-center">
            Iniciar sesión
          </h1>
          <form className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-mono text-sanctuary-muted">Email</span>
              <input
                type="email"
                placeholder="tu@email.com"
                className="w-full px-3 py-2 rounded-lg text-sm font-sans
                           bg-sanctuary-bg border border-sanctuary-border
                           text-sanctuary-text placeholder:text-sanctuary-muted
                           focus:outline-none focus:border-sanctuary-accent
                           transition-colors duration-200"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-mono text-sanctuary-muted">Contraseña</span>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-lg text-sm font-sans
                           bg-sanctuary-bg border border-sanctuary-border
                           text-sanctuary-text placeholder:text-sanctuary-muted
                           focus:outline-none focus:border-sanctuary-accent
                           transition-colors duration-200"
              />
            </label>
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg text-sm font-sans font-medium
                         bg-sanctuary-accent text-sanctuary-bg
                         hover:bg-sanctuary-accent-hover
                         transition-colors duration-200 cursor-pointer"
            >
              Entrar
            </button>
          </form>
        </div>

        <p className="text-center mt-5 text-xs font-sans text-sanctuary-muted">
          ¿No tienes cuenta?{" "}
          <Link
            href="/register"
            className="text-sanctuary-accent hover:text-sanctuary-accent-hover transition-colors"
          >
            Crear cuenta
          </Link>
        </p>
      </div>
    </div>
  );
}
