import AuthCallback from "../../src/components/auth/AuthCallback";

export const meta = () => [{ title: "Authenticating..." }];

export default function Route() {
  return <AuthCallback />;
}
