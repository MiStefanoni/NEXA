"use client";

import Image from "next/image";
import { useState } from "react";

export function LandingPage() {
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const nome = String(formData.get("nome") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const profissao = String(formData.get("profissao") || "").trim();
    const redeSocial = String(formData.get("redeSocial") || "").trim();
    const website = String(formData.get("website") || "").trim();

    if (!nome || !email || !profissao) {
      setFeedback("Preencha Nome, E-mail e Profissão para entrar na lista de espera.");
      setError(true);
      return;
    }

    setSending(true);
    setFeedback("");
    setError(false);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          email,
          profissao,
          redeSocial,
          website,
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Não foi possível enviar sua inscrição agora. Tente novamente.");
      }

      form.reset();
      setFeedback("Inscrição enviada com sucesso. Nossa equipe entrará em contato em breve.");
      setError(false);
    } catch (submissionError) {
      setFeedback(submissionError.message || "Não foi possível enviar sua inscrição agora. Tente novamente.");
      setError(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(132,48,136,0.08),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(228,126,74,0.12),_transparent_34%)]" />
          <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
            <div className="grid items-end gap-12 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="max-w-2xl">
                <Image src="/Nexa2.png" alt="Nexa" width={136} height={48} className="h-12 w-auto" priority />
                <h1 className="mt-8 font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                  Uma nova forma de conectar mulheres talentosas a oportunidades reais.
                </h1>
                <p className="mt-6 text-lg leading-8 text-charcoal/75">
                  A Nexa é uma plataforma criada para dar visibilidade a profissionais mulheres e facilitar conexões com pessoas e empresas que buscam serviços de qualidade.
                </p>
                <p className="mt-6 inline-flex rounded-full bg-mist px-4 py-2 text-sm font-semibold text-clay">
                  Lançamento previsto para o final de maio.
                </p>
                <div className="mt-8">
                  <a
                    href="#lista-espera"
                    className="inline-flex rounded-2xl bg-clay px-6 py-4 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-clay/90"
                  >
                    Entrar na lista de espera
                  </a>
                </div>
              </div>
              <div className="flex items-end justify-center lg:justify-end">
                <Image
                  src="/Women.png"
                  alt="Mulher representando a comunidade Nexa"
                  width={962}
                  height={1080}
                  className="w-full max-w-md self-end object-contain lg:max-w-none"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal">O que é a Nexa</p>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Uma plataforma pensada para visibilidade, conexão e confiança</h2>
            <p className="mt-6 leading-8 text-charcoal/75">
              A Nexa é uma plataforma que reúne profissionais mulheres de diferentes áreas em um espaço organizado, acessível e confiável. Profissionais podem criar seus perfis, apresentar seus serviços e aumentar sua visibilidade. Clientes podem descobrir talentos, conhecer trabalhos e entrar em contato com profissionais qualificadas.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <article className="rounded-3xl bg-white p-8 shadow-soft">
              <p className="text-sm font-semibold text-clay">Passo 1</p>
              <h3 className="mt-3 font-display text-2xl font-bold">Profissionais se cadastram</h3>
              <p className="mt-4 leading-7 text-charcoal/75">
                Mulheres de diferentes áreas enviam suas informações para fazer parte da plataforma.
              </p>
            </article>
            <article className="rounded-3xl bg-white p-8 shadow-soft">
              <p className="text-sm font-semibold text-clay">Passo 2</p>
              <h3 className="mt-3 font-display text-2xl font-bold">A Nexa analisa e organiza os perfis</h3>
              <p className="mt-4 leading-7 text-charcoal/75">
                Os perfis passam por curadoria para garantir apresentação clara, profissional e confiável.
              </p>
            </article>
            <article className="rounded-3xl bg-white p-8 shadow-soft">
              <p className="text-sm font-semibold text-clay">Passo 3</p>
              <h3 className="mt-3 font-display text-2xl font-bold">Clientes encontram e entram em contato com profissionais qualificadas</h3>
              <p className="mt-4 leading-7 text-charcoal/75">
                Pessoas e empresas conseguem descobrir talentos com mais facilidade, segurança e contexto.
              </p>
            </article>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal">Para quem é a Nexa</p>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Uma plataforma para quem quer ser vista e para quem quer contratar com mais confiança</h2>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <article className="rounded-3xl bg-white p-8 shadow-soft">
              <h3 className="font-display text-2xl font-bold">Para profissionais</h3>
              <p className="mt-4 leading-8 text-charcoal/75">
                Ganhe visibilidade, apresente seus serviços e faça parte de uma rede criada para impulsionar talentos femininos.
              </p>
              <p className="mt-5 text-sm leading-7 text-charcoal/65">
                Ideal para mulheres profissionais, autônomas, empreendedoras ou prestadoras de serviço que querem mais visibilidade e novas oportunidades.
              </p>
            </article>
            <article className="rounded-3xl bg-white p-8 shadow-soft">
              <h3 className="font-display text-2xl font-bold">Para quem quer contratar</h3>
              <p className="mt-4 leading-8 text-charcoal/75">
                Encontre profissionais qualificadas em diferentes áreas, com mais clareza, confiança e facilidade.
              </p>
              <p className="mt-5 text-sm leading-7 text-charcoal/65">
                Ideal para pessoas e empresas que procuram contratar mulheres qualificadas para serviços confiáveis, criativos e profissionais.
              </p>
            </article>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-8 lg:px-8">
          <div className="rounded-[2rem] bg-mist px-8 py-10 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal">Lançamento</p>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Estamos preparando a chegada da plataforma</h2>
            <p className="mt-5 max-w-3xl leading-8 text-charcoal/75">
              Estamos preparando o lançamento da plataforma para o final de maio. Enquanto isso, você pode entrar na lista de espera para receber novidades e ser uma das primeiras pessoas a participar da Nexa.
            </p>
          </div>
        </section>

        <section id="lista-espera" className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="rounded-3xl bg-white p-8 shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal">Lista de espera</p>
              <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Participe antes do lançamento</h2>
              <p className="mt-5 leading-8 text-charcoal/75">
                Tem interesse em participar da Nexa? Preencha o formulário abaixo para entrar na lista de espera. Nossa equipe entrará em contato em breve.
              </p>
            </div>

            <section className="rounded-3xl bg-white p-8 shadow-soft" aria-labelledby="waiting-list-title">
              <h3 id="waiting-list-title" className="font-display text-2xl font-bold">Entrar na lista de espera</h3>
              <form className="mt-6 grid gap-5" onSubmit={handleSubmit} noValidate>
                <div>
                  <label htmlFor="nome" className="mb-2 block text-sm font-medium">Nome</label>
                  <input
                    id="nome"
                    name="nome"
                    type="text"
                    required
                    className="w-full rounded-2xl border border-charcoal/15 bg-ivory px-4 py-3 outline-none placeholder:text-charcoal/35 focus:border-teal"
                    placeholder="Seu nome completo"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium">E-mail</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="w-full rounded-2xl border border-charcoal/15 bg-ivory px-4 py-3 outline-none placeholder:text-charcoal/35 focus:border-teal"
                    placeholder="voce@exemplo.com"
                  />
                </div>
                <div>
                  <label htmlFor="profissao" className="mb-2 block text-sm font-medium">Profissão</label>
                  <input
                    id="profissao"
                    name="profissao"
                    type="text"
                    required
                    className="w-full rounded-2xl border border-charcoal/15 bg-ivory px-4 py-3 outline-none placeholder:text-charcoal/35 focus:border-teal"
                    placeholder="Como você atua hoje?"
                  />
                </div>
                <div>
                  <label htmlFor="rede-social" className="mb-2 block text-sm font-medium">Rede social</label>
                  <input
                    id="rede-social"
                    name="redeSocial"
                    type="text"
                    className="w-full rounded-2xl border border-charcoal/15 bg-ivory px-4 py-3 outline-none placeholder:text-charcoal/35 focus:border-teal"
                    placeholder="@seuperfil"
                  />
                </div>
                <div>
                  <label htmlFor="website" className="mb-2 block text-sm font-medium">Website</label>
                  <input
                    id="website"
                    name="website"
                    type="url"
                    className="w-full rounded-2xl border border-charcoal/15 bg-ivory px-4 py-3 outline-none placeholder:text-charcoal/35 focus:border-teal"
                    placeholder="https://seusite.com"
                  />
                </div>
                {feedback ? (
                  <p
                    className={`rounded-2xl px-4 py-3 text-sm ${
                      error ? "border border-red-200 bg-red-50 text-red-700" : "border border-clay/15 bg-mist text-charcoal/75"
                    }`}
                  >
                    {feedback}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={sending}
                  className="rounded-2xl bg-clay px-6 py-4 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-clay/90 disabled:opacity-60"
                >
                  {sending ? "Enviando..." : "Enviar"}
                </button>
              </form>
            </section>
          </div>
        </section>
      </main>

      <footer className="border-t border-charcoal/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-sm text-charcoal/70 lg:px-8">
          <p>Nexa © 2026. Todos os direitos reservados.</p>
          <p>info@onlinenexa.com</p>
        </div>
      </footer>
    </>
  );
}
