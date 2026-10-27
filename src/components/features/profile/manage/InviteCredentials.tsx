"use client";

import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { CreatedCredentials } from "@/hooks/auth/useInviteMember";

interface InviteCredentialsProps {
  credentials: CreatedCredentials;
  copied: boolean;
  onCopy: () => void;
  onDone: () => void;
}

export function InviteCredentials({
  credentials,
  copied,
  onCopy,
  onDone,
}: InviteCredentialsProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-2.5 rounded-2xl border border-field-green/30 bg-field-green/10 p-3.5">
        <div>
          <span className="text-[10px] font-bold uppercase text-muted-foreground">
            E-mail de acesso
          </span>
          <p className="select-all text-xs font-bold text-primary">{credentials.email}</p>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase text-muted-foreground">
            Senha inicial (3 primeiras letras + 123)
          </span>
          <code className="mt-0.5 block select-all rounded-md border border-field-green/40 bg-card px-2.5 py-1 font-mono text-sm font-extrabold text-field-green">
            {credentials.password}
          </code>
        </div>
      </div>
      <DialogFooter className="flex flex-row gap-2 pt-2">
        <Button variant="outline" className="flex-1" onClick={onCopy}>
          {copied ? <Check className="text-field-green" /> : <Copy />}
          {copied ? "Copiado!" : "Copiar credenciais"}
        </Button>
        <Button className="flex-1" onClick={onDone}>
          Concluir
        </Button>
      </DialogFooter>
    </div>
  );
}
