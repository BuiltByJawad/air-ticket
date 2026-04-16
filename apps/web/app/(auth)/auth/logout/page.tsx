import { logoutAction } from './actions';

export default async function LogoutPage() {
  return (
    <main>
      <h1>Sign out</h1>
      <form action={logoutAction}>
        <button type="submit">Sign out</button>
      </form>
    </main>
  );
}
