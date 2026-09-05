import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-4 space-y-8">
      <div className="rounded-full bg-destructive/10 p-8 animate-pulse">
        <AlertTriangle className="w-16 h-16 text-destructive" />
      </div>
      <div className="space-y-2">
        <h1 className="font-display text-4xl font-bold">Página não encontrada</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Parece que você tentou acessar uma área que não existe ou ainda não foi construída na nossa comunidade digital.
        </p>
      </div>
      <Link href="/">
        <Button size="lg" className="rounded-full font-display">
          Voltar para o Início
        </Button>
      </Link>
    </div>
  );
}
