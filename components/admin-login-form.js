"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSending(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Não foi possível acessar.");
      }

      router.replace("/admin");
      router.refresh();
    } catch (submissionError) {
      setError(submissionError.message || "Não foi possível acessar.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-ivory px-6 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] bg-white p-8 shadow-soft lg:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal">Nexa Admin</p>
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-5xl">
            Acesso seguro para revisar, publicar e atualizar perfis
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-charcoal/75">
            Entre na área administrativa da Nexa para revisar candidaturas, editar perfis profissionais e manter o diretório público sempre alinhado com a curadoria da plataforma.
          </p>
        </section>

        <section className="rounded-[2rem] bg-white p-8 shadow-soft lg:p-10">
          <div className="mb-8 inline-flex items-center">
            <Image src="/Nexa2.png" alt="Nexa" width={113} height={40} className="h-10 w-auto" priority />
          </div>
          <h2 className="font-display text-3xl font-bold">Entrar</h2>
          <p className="mt-3 text-sm leading-7 text-charcoal/70">
            Use a senha administrativa configurada no ambiente para acessar o painel.
          </p>
          <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="admin-password" className="mb-2 block text-sm font-medium">
                Senha
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-charcoal/15 bg-ivory px-4 py-3 outline-none placeholder:text-charcoal/35 focus:border-teal"
                placeholder="Digite a senha do admin"
                autoComplete="current-password"
              />
            </div>
            {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
            <button
              type="submit"
              disabled={sending}
              className="rounded-2xl bg-clay px-6 py-4 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-clay/90 disabled:opacity-60"
            >
              {sending ? "Entrando..." : "Acessar painel"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
