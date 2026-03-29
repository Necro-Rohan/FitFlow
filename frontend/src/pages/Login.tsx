import { useState, type FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { TextInput } from '../components/TextInput';
import { PrimaryButton } from '../components/PrimaryButton';

export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = await login(email, password);

    if (!success) {
      setError('Invalid email or password.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-base flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="bg-surface border border-border-subtle rounded-lg p-6">
          <h1 className="text-lg font-bold text-text-primary mb-1">FitFlow</h1>
          <p className="text-sm text-text-muted mb-5">Sign in to continue</p>

          <form onSubmit={handleSubmit}>
            <TextInput
              label="Email"
              value={email}
              onChange={setEmail}
              type="email"
              placeholder="owner@fitflow.com"
              required
              id="login-email"
            />
            <TextInput
              label="Password"
              value={password}
              onChange={setPassword}
              type="password"
              placeholder="••••••••"
              required
              id="login-password"
            />

            {error && (
              <p className="text-sm text-danger mb-3">{error}</p>
            )}

            <PrimaryButton type="submit" loading={loading} className="w-full">
              Login
            </PrimaryButton>
          </form>
        </div>
      </div>
    </div>
  );
}
