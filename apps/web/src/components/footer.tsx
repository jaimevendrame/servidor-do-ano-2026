export function Footer() {
  const ano = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="container py-6 text-center text-xs text-muted-foreground">
        &copy; {ano} Prefeitura Municipal &middot; Sistema de votacao Servidor do Ano
      </div>
    </footer>
  );
}
