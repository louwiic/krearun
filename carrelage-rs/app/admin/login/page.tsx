import { login } from "../actions";
import "../admin.css";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="rs-admin rs-login">
      <form action={login}>
        <img
          src="/site/Carrelage-RS-Logo-HD.png"
          alt="Carrelage RS"
          width="110"
        />
        <h1>Espace de gestion</h1>
        <p>Devis et métrés</p>
        {!process.env.ADMIN_PASSWORD ? (
          <p role="alert">
            Accès non configuré. Définir ADMIN_PASSWORD sur le serveur.
          </p>
        ) : (
          <>
            <label>
              Mot de passe
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
            <button className="primary">Se connecter</button>
          </>
        )}
        {error && <p role="alert">Connexion refusée.</p>}
      </form>
    </main>
  );
}
