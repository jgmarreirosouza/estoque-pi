import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { onAuthStateChanged, reload, signOut, User } from 'firebase/auth';
import { auth } from '../services/firebase';
import { Papel, papelDoUsuario } from '../services/papeis';

interface AuthContextData {
  user: User | null;
  loading: boolean;
  /** 'equipe' (e-mail na lista da ONG) ou 'doador' (qualquer outra conta). */
  papel: Papel | null;
  /** E-mail confirmado (contas do Google já vêm confirmadas). */
  verificado: boolean;
  /** Recarrega o usuário para saber se o e-mail acabou de ser confirmado. */
  recarregar: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({
  user: null,
  loading: true,
  papel: null,
  verificado: false,
  recarregar: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setVersao] = useState(0); // força nova renderização após recarregar()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Sessões anônimas antigas (do antigo "modo visitante") são encerradas.
      if (firebaseUser?.isAnonymous) {
        await signOut(auth);
        return;
      }
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const recarregar = useCallback(async () => {
    const atual = auth.currentUser;
    if (!atual) return;
    await reload(atual);
    await atual.getIdToken(true); // atualiza o token com email_verified
    setUser(atual);
    setVersao((v) => v + 1);
  }, []);

  const verificado = !!user && user.emailVerified;
  const papel = papelDoUsuario(user);

  return (
    <AuthContext.Provider value={{ user, loading, papel, verificado, recarregar }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
