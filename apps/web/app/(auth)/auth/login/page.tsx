import { loginAction } from './actions';

export default async function LoginPage({
  searchParams
}: {
  searchParams?: { error?: string };
}) {
  const error = searchParams?.error;

  const errorMessage =
    error === 'invalid_credentials'
      ? 'Invalid email or password.'
    : error === 'invalid_input'
        ? 'Please enter a valid email and password.'
        : error === 'api_config'
          ? 'Web is missing API_BASE_URL. Set apps/web/.env API_BASE_URL=http://localhost:3001 and restart web.'
          : error === 'api_unreachable'
            ? 'API is unreachable. Ensure the Nest API is running on http://localhost:3001.'
            : error === 'api_error'
              ? 'API returned an unexpected error.'
              : error === 'unknown'
                ? 'Unexpected error. Check server logs.'
        : null;

  return (
    <main>
      <h1>Sign in</h1>
      {errorMessage ? <p>{errorMessage}</p> : null}
      <form action={loginAction}>
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" required />
        </div>
        <button type="submit">Sign in</button>
      </form>
    </main>
  );
}
