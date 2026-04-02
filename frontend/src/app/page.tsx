"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Indicadores = {
  totalClientes: number;
  totalProdutos: number;
  totalOrdensAbertas: number;
  totalProdutosBaixoEstoque: number;
  faturamentoMes: number;
  lucroMes: number;
};

type DashboardResumo = {
  indicadores: Indicadores;
  ordensRecentes: Array<{
    id: string;
    cliente: string;
    aparelho: string;
    status: string;
    valor_total: number;
    created_at: string;
  }>;
  produtosBaixoEstoque: Array<{
    id: string;
    nome: string;
    quantidade_estoque: number;
    estoque_minimo: number;
  }>;
};

type Cliente = {
  id: string;
  nome: string;
  telefone: string;
  email?: string | null;
  cpf?: string | null;
};

type Produto = {
  id: string;
  nome: string;
  marca?: string | null;
  quantidade_estoque: number;
  estoque_minimo: number;
  preco_venda: number;
  estoque_baixo: boolean;
};

type OrdemServico = {
  id: string;
  status: string;
  aparelho_marca: string;
  aparelho_modelo: string;
  defeito_relatado: string;
  valor_total: number;
  cliente?: {
    nome: string;
  };
};

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const initialDashboard: DashboardResumo = {
  indicadores: {
    totalClientes: 0,
    totalProdutos: 0,
    totalOrdensAbertas: 0,
    totalProdutosBaixoEstoque: 0,
    faturamentoMes: 0,
    lucroMes: 0,
  },
  ordensRecentes: [],
  produtosBaixoEstoque: [],
};

export default function Home() {
  const [dashboard, setDashboard] = useState<DashboardResumo>(initialDashboard);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [clienteForm, setClienteForm] = useState({
    nome: "",
    telefone: "",
    email: "",
    cpf: "",
  });
  const [produtoForm, setProdutoForm] = useState({
    nome: "",
    marca: "",
    estoque_minimo: "1",
    quantidade_inicial: "0",
    preco_custo: "0",
    preco_venda: "0",
  });
  const [ordemForm, setOrdemForm] = useState({
    cliente_id: "",
    aparelho_marca: "",
    aparelho_modelo: "",
    defeito_relatado: "",
    valor_mao_de_obra: "0",
    desconto: "0",
  });

  const cards = useMemo(
    () => [
      {
        label: "Clientes",
        value: dashboard.indicadores.totalClientes,
      },
      {
        label: "Produtos",
        value: dashboard.indicadores.totalProdutos,
      },
      {
        label: "OS em aberto",
        value: dashboard.indicadores.totalOrdensAbertas,
      },
      {
        label: "Estoque baixo",
        value: dashboard.indicadores.totalProdutosBaixoEstoque,
      },
      {
        label: "Faturamento do mês",
        value: formatCurrency(dashboard.indicadores.faturamentoMes),
      },
      {
        label: "Lucro estimado do mês",
        value: formatCurrency(dashboard.indicadores.lucroMes),
      },
    ],
    [dashboard],
  );

  async function loadData() {
    setCarregando(true);

    try {
      const [dashboardResponse, clientesResponse, produtosResponse, ordensResponse] =
        await Promise.all([
          fetch(`${apiUrl}/dashboard/resumo`, { cache: "no-store" }),
          fetch(`${apiUrl}/clientes`, { cache: "no-store" }),
          fetch(`${apiUrl}/estoque/produtos`, { cache: "no-store" }),
          fetch(`${apiUrl}/ordens-servico`, { cache: "no-store" }),
        ]);

      const [dashboardData, clientesData, produtosData, ordensData] =
        await Promise.all([
          dashboardResponse.json(),
          clientesResponse.json(),
          produtosResponse.json(),
          ordensResponse.json(),
        ]);

      setDashboard(dashboardData);
      setClientes(clientesData);
      setProdutos(produtosData);
      setOrdens(ordensData);
    } catch {
      setMensagem(
        "Não foi possível carregar os dados. Verifique se o backend está rodando.",
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function submitCliente(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const response = await fetch(`${apiUrl}/clientes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...clienteForm,
        email: clienteForm.email || undefined,
        cpf: clienteForm.cpf || undefined,
      }),
    });

    if (!response.ok) {
      setMensagem("Falha ao cadastrar cliente.");
      return;
    }

    setClienteForm({
      nome: "",
      telefone: "",
      email: "",
      cpf: "",
    });
    setMensagem("Cliente cadastrado com sucesso.");
    await loadData();
  }

  async function submitProduto(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const response = await fetch(`${apiUrl}/estoque/produtos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nome: produtoForm.nome,
        marca: produtoForm.marca || undefined,
        estoque_minimo: Number(produtoForm.estoque_minimo),
        quantidade_inicial: Number(produtoForm.quantidade_inicial),
        preco_custo: Number(produtoForm.preco_custo),
        preco_venda: Number(produtoForm.preco_venda),
      }),
    });

    if (!response.ok) {
      setMensagem("Falha ao cadastrar produto.");
      return;
    }

    setProdutoForm({
      nome: "",
      marca: "",
      estoque_minimo: "1",
      quantidade_inicial: "0",
      preco_custo: "0",
      preco_venda: "0",
    });
    setMensagem("Produto cadastrado com sucesso.");
    await loadData();
  }

  async function submitOrdem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const response = await fetch(`${apiUrl}/ordens-servico`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cliente_id: ordemForm.cliente_id,
        aparelho_marca: ordemForm.aparelho_marca,
        aparelho_modelo: ordemForm.aparelho_modelo,
        defeito_relatado: ordemForm.defeito_relatado,
        termo_responsabilidade_aceito: true,
        valor_mao_de_obra: Number(ordemForm.valor_mao_de_obra),
        desconto: Number(ordemForm.desconto),
      }),
    });

    if (!response.ok) {
      setMensagem("Falha ao criar ordem de serviço.");
      return;
    }

    setOrdemForm({
      cliente_id: clientes[0]?.id ?? "",
      aparelho_marca: "",
      aparelho_modelo: "",
      defeito_relatado: "",
      valor_mao_de_obra: "0",
      desconto: "0",
    });
    setMensagem("Ordem de serviço criada com sucesso.");
    await loadData();
  }

  useEffect(() => {
    if (!ordemForm.cliente_id && clientes.length > 0) {
      setOrdemForm((current) => ({
        ...current,
        cliente_id: clientes[0].id,
      }));
    }
  }, [clientes, ordemForm.cliente_id]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
            Sistema de gestão
          </p>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Loja de celulares pronta para operar clientes, estoque e ordens de serviço
              </h1>
              <p className="max-w-3xl text-sm text-slate-300 sm:text-base">
                Esta primeira versão entrega backend NestJS com PostgreSQL e Prisma,
                além de um painel Next.js para acompanhar indicadores e cadastrar dados
                principais do MVP.
              </p>
            </div>
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
              API: {apiUrl}
            </div>
          </div>
          {mensagem ? (
            <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
              {mensagem}
            </div>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <article
              key={card.label}
              className="rounded-3xl border border-white/10 bg-slate-900/80 p-5"
            >
              <p className="text-sm text-slate-400">{card.label}</p>
              <strong className="mt-3 block text-3xl font-semibold text-white">
                {card.value}
              </strong>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-6">
            <Panel title="Ordens recentes">
              {carregando ? (
                <p className="text-sm text-slate-400">Carregando ordens...</p>
              ) : dashboard.ordensRecentes.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Nenhuma ordem cadastrada até o momento.
                </p>
              ) : (
                <div className="space-y-3">
                  {dashboard.ordensRecentes.map((ordem) => (
                    <div
                      key={ordem.id}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium text-white">{ordem.cliente}</p>
                          <p className="text-sm text-slate-400">{ordem.aparelho}</p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-sm text-cyan-300">{ordem.status}</p>
                          <p className="font-semibold text-white">
                            {formatCurrency(ordem.valor_total)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Produtos com estoque baixo">
              {dashboard.produtosBaixoEstoque.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Nenhum produto abaixo do mínimo.
                </p>
              ) : (
                <div className="space-y-3">
                  {dashboard.produtosBaixoEstoque.map((produto) => (
                    <div
                      key={produto.id}
                      className="flex items-center justify-between rounded-2xl border border-amber-300/10 bg-amber-300/5 p-4"
                    >
                      <div>
                        <p className="font-medium text-white">{produto.nome}</p>
                        <p className="text-sm text-slate-400">
                          Mínimo esperado: {produto.estoque_minimo}
                        </p>
                      </div>
                      <strong className="text-lg text-amber-200">
                        {produto.quantidade_estoque}
                      </strong>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <div className="grid gap-6">
            <Panel title="Cadastrar cliente">
              <form className="grid gap-3" onSubmit={submitCliente}>
                <Input
                  label="Nome"
                  value={clienteForm.nome}
                  onChange={(value) =>
                    setClienteForm((current) => ({ ...current, nome: value }))
                  }
                />
                <Input
                  label="Telefone"
                  value={clienteForm.telefone}
                  onChange={(value) =>
                    setClienteForm((current) => ({ ...current, telefone: value }))
                  }
                />
                <Input
                  label="E-mail"
                  value={clienteForm.email}
                  onChange={(value) =>
                    setClienteForm((current) => ({ ...current, email: value }))
                  }
                />
                <Input
                  label="CPF"
                  value={clienteForm.cpf}
                  onChange={(value) =>
                    setClienteForm((current) => ({ ...current, cpf: value }))
                  }
                />
                <button className="primary-button" type="submit">
                  Salvar cliente
                </button>
              </form>
            </Panel>

            <Panel title="Cadastrar produto">
              <form className="grid gap-3" onSubmit={submitProduto}>
                <Input
                  label="Nome"
                  value={produtoForm.nome}
                  onChange={(value) =>
                    setProdutoForm((current) => ({ ...current, nome: value }))
                  }
                />
                <Input
                  label="Marca"
                  value={produtoForm.marca}
                  onChange={(value) =>
                    setProdutoForm((current) => ({ ...current, marca: value }))
                  }
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Estoque mínimo"
                    type="number"
                    value={produtoForm.estoque_minimo}
                    onChange={(value) =>
                      setProdutoForm((current) => ({
                        ...current,
                        estoque_minimo: value,
                      }))
                    }
                  />
                  <Input
                    label="Quantidade inicial"
                    type="number"
                    value={produtoForm.quantidade_inicial}
                    onChange={(value) =>
                      setProdutoForm((current) => ({
                        ...current,
                        quantidade_inicial: value,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Preço de custo"
                    type="number"
                    step="0.01"
                    value={produtoForm.preco_custo}
                    onChange={(value) =>
                      setProdutoForm((current) => ({
                        ...current,
                        preco_custo: value,
                      }))
                    }
                  />
                  <Input
                    label="Preço de venda"
                    type="number"
                    step="0.01"
                    value={produtoForm.preco_venda}
                    onChange={(value) =>
                      setProdutoForm((current) => ({
                        ...current,
                        preco_venda: value,
                      }))
                    }
                  />
                </div>
                <button className="primary-button" type="submit">
                  Salvar produto
                </button>
              </form>
            </Panel>

            <Panel title="Abrir ordem de serviço">
              <form className="grid gap-3" onSubmit={submitOrdem}>
                <label className="field">
                  <span className="field-label">Cliente</span>
                  <select
                    className="field-input"
                    value={ordemForm.cliente_id}
                    onChange={(event) =>
                      setOrdemForm((current) => ({
                        ...current,
                        cliente_id: event.target.value,
                      }))
                    }
                  >
                    {clientes.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nome}
                      </option>
                    ))}
                  </select>
                </label>
                <Input
                  label="Marca do aparelho"
                  value={ordemForm.aparelho_marca}
                  onChange={(value) =>
                    setOrdemForm((current) => ({
                      ...current,
                      aparelho_marca: value,
                    }))
                  }
                />
                <Input
                  label="Modelo do aparelho"
                  value={ordemForm.aparelho_modelo}
                  onChange={(value) =>
                    setOrdemForm((current) => ({
                      ...current,
                      aparelho_modelo: value,
                    }))
                  }
                />
                <label className="field">
                  <span className="field-label">Defeito relatado</span>
                  <textarea
                    className="field-input min-h-24 resize-y"
                    value={ordemForm.defeito_relatado}
                    onChange={(event) =>
                      setOrdemForm((current) => ({
                        ...current,
                        defeito_relatado: event.target.value,
                      }))
                    }
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Mão de obra"
                    type="number"
                    step="0.01"
                    value={ordemForm.valor_mao_de_obra}
                    onChange={(value) =>
                      setOrdemForm((current) => ({
                        ...current,
                        valor_mao_de_obra: value,
                      }))
                    }
                  />
                  <Input
                    label="Desconto"
                    type="number"
                    step="0.01"
                    value={ordemForm.desconto}
                    onChange={(value) =>
                      setOrdemForm((current) => ({
                        ...current,
                        desconto: value,
                      }))
                    }
                  />
                </div>
                <button className="primary-button" type="submit">
                  Criar OS
                </button>
              </form>
            </Panel>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <Panel title="Clientes cadastrados">
            <List
              items={clientes.map((cliente) => ({
                title: cliente.nome,
                description: `${cliente.telefone}${cliente.email ? ` • ${cliente.email}` : ""}`,
              }))}
              emptyLabel="Nenhum cliente cadastrado."
            />
          </Panel>

          <Panel title="Produtos cadastrados">
            <List
              items={produtos.map((produto) => ({
                title: produto.nome,
                description: `${produto.quantidade_estoque} em estoque • ${formatCurrency(produto.preco_venda)}`,
                emphasis: produto.estoque_baixo,
              }))}
              emptyLabel="Nenhum produto cadastrado."
            />
          </Panel>

          <Panel title="Todas as ordens">
            <List
              items={ordens.map((ordem) => ({
                title: `${ordem.aparelho_marca} ${ordem.aparelho_modelo}`,
                description: `${ordem.cliente?.nome ?? "Sem cliente"} • ${ordem.status} • ${formatCurrency(ordem.valor_total)}`,
              }))}
              emptyLabel="Nenhuma ordem cadastrada."
            />
          </Panel>
        </section>
      </div>
    </main>
  );
}

function Panel({
  title,
  children,
}: Readonly<{
  title: string;
  children: React.ReactNode;
}>) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  step,
}: Readonly<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  step?: string;
}>) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <input
        className="field-input"
        type={type}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function List({
  items,
  emptyLabel,
}: Readonly<{
  items: Array<{ title: string; description: string; emphasis?: boolean }>;
  emptyLabel: string;
}>) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-400">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={`${item.title}-${item.description}`}
          className={`rounded-2xl border p-4 ${
            item.emphasis
              ? "border-amber-300/10 bg-amber-300/5"
              : "border-white/10 bg-white/5"
          }`}
        >
          <p className="font-medium text-white">{item.title}</p>
          <p className="text-sm text-slate-400">{item.description}</p>
        </div>
      ))}
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value ?? 0);
}
