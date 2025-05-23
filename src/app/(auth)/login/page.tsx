import { LoginForm } from '@/components/auth/LoginForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - Peso Sensei',
};

export default function LoginPage() {
  return <LoginForm />;
}
