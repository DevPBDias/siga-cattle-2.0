"use client";

import { useState } from "react";
import { KeyRound, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormRow } from "@/components/ui/FormRow";
import { Input } from "@/components/ui/input";
import { InviteCredentials } from "@/components/features/profile/manage/InviteCredentials";
import { useInviteMember } from "@/hooks/auth/useInviteMember";
import { UserProfile } from "@/types/user_profile.type";

interface InviteMemberDialogProps {
  open: boolean;
  ownerId?: string;
  farmName?: string;
  onCreate: (data: Partial<UserProfile>) => Promise<UserProfile>;
  onOpenChange: (open: boolean) => void;
}

export function InviteMemberDialog({
  open,
  ownerId,
  farmName,
  onCreate,
  onOpenChange,
}: InviteMemberDialogProps) {
  const { data, loading, error, actions } = useInviteMember();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const generatedPassword = actions.previewPassword(email);

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      actions.reset();
      setFullName("");
      setEmail("");
      setCopied(false);
    }
    onOpenChange(nextOpen);
  };

  const handleCopy = async () => {
    if (!data.credentials) return;
    await navigator.clipboard.writeText(
      `Acesso INDI Ouro:\nE-mail: ${data.credentials.email}\nSenha: ${data.credentials.password}`,
    );
    setCopied(true);
    toast.success("Credenciais copiadas.");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-card p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-primary">
            <UserPlus className="h-5 w-5 text-field-green" />
            {data.credentials ? "Usuário Criado" : "Criar Novo Usuário"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {data.credentials
              ? "O usuário já pode entrar no aplicativo com as credenciais abaixo."
              : "O convidado entra como membro, com visualização da tela de Consulta."}
          </DialogDescription>
        </DialogHeader>

        {data.credentials ? (
          <InviteCredentials
            credentials={data.credentials}
            copied={copied}
            onCopy={() => void handleCopy()}
            onDone={() => handleClose(false)}
          />
        ) : (
          <div className="space-y-3">
            {error && (
              <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                {error}
              </p>
            )}
            <FormRow label="Nome completo" htmlFor="invite-name" required>
              <Input
                id="invite-name"
                placeholder="Ex: Carlos Eduardo"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </FormRow>
            <FormRow label="E-mail" htmlFor="invite-email" required>
              <Input
                id="invite-email"
                type="email"
                placeholder="Ex: carlos@fazenda.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </FormRow>
            <div className="rounded-2xl border border-field-green/30 bg-field-green/10 p-3 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-primary">
                  <KeyRound className="h-3.5 w-3.5 text-field-green" />
                  Senha inicial
                </span>
                <code className="rounded-md border border-field-green/40 bg-card px-2 py-0.5 font-mono text-xs font-bold text-field-green">
                  {generatedPassword || "..."}
                </code>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Regra automática: 3 primeiras letras do e-mail + 123.
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-muted/40 p-3 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-primary">Função atribuída:</span>
                <span className="rounded-md bg-field-green/10 px-2 py-0.5 text-[11px] font-bold text-field-green">
                  Membro da equipe
                </span>
              </div>
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                Permissão padrão: somente visualização da tela de <strong>Consulta</strong>.
              </p>
            </div>
            <DialogFooter className="flex flex-row gap-2 pt-2">
              <Button variant="outline" className="flex-1" disabled={loading} onClick={() => handleClose(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1"
                disabled={loading}
                onClick={() =>
                  void actions.invite({
                    fullName,
                    email,
                    ownerId,
                    farmName,
                    createLocal: onCreate,
                  })
                }
              >
                {loading ? "Criando..." : "Criar Usuário"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
