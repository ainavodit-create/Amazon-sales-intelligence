import { useState } from 'react';
import { Lock, Clock as Unlock, Eye, EyeOff, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { useDemoMode } from '../contexts/DemoModeContext';

const DEMO_EMAIL = 'navodit@caramelly.in';
const DEMO_PASSWORD = 'ilovecoffee';

interface EncryptModalProps {
  open: boolean;
  onClose: () => void;
}

export function EncryptModal({ open, onClose }: EncryptModalProps) {
  const { setIsDemoMode } = useDemoMode();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = () => {
    setError('');
    if (email.trim() === DEMO_EMAIL && password === DEMO_PASSWORD) {
      setIsDemoMode(false);
      setEmail('');
      setPassword('');
      onClose();
    } else {
      setError('Invalid credentials. Please try again.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <Lock className="w-5 h-5 text-gray-600" />
            Unlock Full Data View
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <p className="text-sm text-gray-500">
            Enter your credentials to disable Demo Mode and view unmasked data.
          </p>

          {error && (
            <Alert variant="destructive" className="py-2">
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => { setEmail(''); setPassword(''); setError(''); onClose(); }}
            >
              <X className="w-4 h-4 mr-1.5" />
              Cancel
            </Button>
            <Button className="flex-1 bg-gray-900 hover:bg-gray-700" onClick={handleLogin}>
              <Unlock className="w-4 h-4 mr-1.5" />
              Unlock
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
