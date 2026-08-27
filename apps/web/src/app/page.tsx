import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-8 py-12 text-center">
      <div className="space-y-3">
        <h1 className="text-3xl text-primary">Premiacao Servidor do Ano 2026</h1>
        <p className="text-base text-muted-foreground">
          Vote no servidor destaque do seu setor. O sistema e anonimo, seguro e fiscalizado.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/login">Entrar como eleitor</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/admin/login">Acessar painel administrativo</Link>
        </Button>
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        Para votar, voce precisara do seu CPF e da data de admissao. A votacao e restrita a janela
        oficial definida pela organizacao.
      </p>
    </div>
  );
}
