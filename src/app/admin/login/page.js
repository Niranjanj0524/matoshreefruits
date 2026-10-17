import LoginForm from "../components/LoginForm";

export const metadata = { title: "Sign in" };

/** Public sign-in page (outside the (panel) group, so no session required). */
export default function AdminLoginPage() {
  return <LoginForm />;
}
