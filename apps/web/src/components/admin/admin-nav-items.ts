import {
  LayoutDashboard,
  FileSpreadsheet,
  Users,
  UserCog,
  CalendarClock,
  Trophy,
  ScrollText,
  type LucideIcon,
} from 'lucide-react';

export interface AdminNavItem {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

/**
 * Fonte da verdade da navegação admin.
 * Reusada pela sidebar (links) e pela topbar (breadcrumb / título).
 * A ordem reflete o fluxo natural: painel → dados → eleição → resultado → auditoria.
 */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    href: '/admin',
    label: 'Painel',
    description: 'Visão geral e status da votação',
    icon: LayoutDashboard,
  },
  {
    href: '/admin/importacao',
    label: 'Importação',
    description: 'Carregar planilha do RH e normalizar setores',
    icon: FileSpreadsheet,
  },
  {
    href: '/admin/candidatos',
    label: 'Candidatos',
    description: 'Gerenciar candidatos por setor',
    icon: Users,
  },
  {
    href: '/admin/eleitores',
    label: 'Eleitores',
    description: 'Listar, bloquear e desbloquear eleitores',
    icon: UserCog,
  },
  {
    href: '/admin/gerenciar-eleicoes',
    label: 'Gerenciar Eleições',
    description: 'Configurar datas de início e fim',
    icon: CalendarClock,
  },
  {
    href: '/admin/apuracao',
    label: 'Apuração',
    description: 'Resultados por setor (após fechamento)',
    icon: Trophy,
  },
  {
    href: '/admin/auditoria',
    label: 'Auditoria',
    description: 'Logs de ações e exportação CSV',
    icon: ScrollText,
  },
];

/**
 * Resolve o item de navegação ativo a partir do pathname.
 * Faz match exato para /admin e por prefixo para as subrotas,
 * garantindo que /admin não capture as filhas.
 */
export function resolveActiveNavItem(pathname: string): AdminNavItem | undefined {
  const matches = ADMIN_NAV_ITEMS.filter(item =>
    item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
  );
  // Prefere o match mais específico (maior href).
  return matches.sort((a, b) => b.href.length - a.href.length)[0];
}
