import Image from 'next/image';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  /**
   * `stacked` — lockup vertical (ícone + texto empilhado), usado na home.
   * `line` — lockup horizontal, usado no header/sidebar do dashboard.
   */
  variant?: 'stacked' | 'line';
  /** Classe de altura (a largura acompanha o aspect ratio). */
  className?: string;
  priority?: boolean;
  alt?: string;
}

// Dimensões intrínsecas dos assets (mantêm o aspect ratio no next/image).
const SPECS = {
  stacked: { light: '/logo-light.png', dark: '/logo-dark.png', width: 1024, height: 600 },
  line: {
    light: '/servidor-do-ano-line-light.png',
    dark: '/servidor-do-ano-line-dark.png',
    width: 1052,
    height: 300,
  },
} as const;

/**
 * Logo institucional com troca automática por tema (light/dark).
 * Renderiza as duas variantes e alterna via CSS (`dark:`), evitando
 * flash e mismatch de hidratação — o tema é classe no <html>.
 */
export function BrandLogo({
  variant = 'line',
  className,
  priority = false,
  alt = 'Servidor do Ano',
}: BrandLogoProps) {
  const spec = SPECS[variant];
  const dims = { width: spec.width, height: spec.height };

  return (
    <>
      <Image
        src={spec.light}
        alt={alt}
        {...dims}
        priority={priority}
        className={cn('block w-auto dark:hidden', className)}
        style={{ width: 'auto' }}
      />
      <Image
        src={spec.dark}
        alt={alt}
        {...dims}
        priority={priority}
        className={cn('hidden w-auto dark:block', className)}
        style={{ width: 'auto' }}
      />
    </>
  );
}
