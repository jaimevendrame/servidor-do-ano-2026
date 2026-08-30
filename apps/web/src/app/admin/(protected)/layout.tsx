'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { getAdminToken } from '@/lib/session';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminTopbar } from '@/components/admin/admin-topbar';

/**
 * Shell da área administrativa protegida.
 * - Guard centralizado: sem token → redireciona para /admin/login.
 * - Fundo mesh liquidglass + sidebar + topbar persistentes.
 * - Transição sutil de entrada ao trocar de rota.
 *
 * A rota /admin/login fica FORA deste route group, então não passa pelo guard
 * (evita loop de redirecionamento) e não recebe o shell.
 */
export default function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [autorizado, setAutorizado] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!getAdminToken()) {
      router.replace('/admin/login');
      return;
    }
    setAutorizado(true);
  }, [router]);

  // Fecha o drawer ao navegar
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Enquanto verifica o token, não pisca o conteúdo protegido.
  if (!autorizado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Verificando acesso...</p>
      </div>
    );
  }

  return (
    <div className="admin-mesh flex min-h-screen">
      <AdminSidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <AdminTopbar onOpenMobile={() => setMobileOpen(true)} />

        <motion.main
          key={pathname}
          className="flex-1 px-4 py-6 md:px-8 md:py-8"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
