import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Wrench, 
  TrendingUp, 
  Plus, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Menu,
  Moon,
  Sun,
  ChevronRight,
  Trash2,
  Edit2,
  ArrowUpRight,
  ArrowDownRight,
  Smartphone
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn, formatCurrency } from './lib/utils';
import { Product, ServiceOrder, ServiceStatus, Transaction } from './types';

type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'theme';
const panelClass = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm';
const inputClass = 'w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500';
const secondaryButtonClass = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors';

const getInitialTheme = (): ThemeMode => {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Tela iPhone 11', category: 'Telas', costPrice: 150, salePrice: 450, stock: 5, minStock: 2 },
  { id: '2', name: 'Bateria Samsung S20', category: 'Baterias', costPrice: 80, salePrice: 220, stock: 3, minStock: 2 },
  { id: '3', name: 'Conector de Carga Moto G8', category: 'Conectores', costPrice: 15, salePrice: 120, stock: 10, minStock: 5 },
];

const INITIAL_SERVICES: ServiceOrder[] = [
  { 
    id: 'OS-001', 
    customerName: 'João Silva', 
    customerPhone: '(11) 98888-7777', 
    deviceModel: 'iPhone 11', 
    issueDescription: 'Tela quebrada', 
    status: 'ready', 
    partsUsed: [{ productId: '1', quantity: 1, costPrice: 150 }],
    laborCost: 100,
    totalPrice: 550,
    createdAt: subDays(new Date(), 2).toISOString(),
    updatedAt: subDays(new Date(), 1).toISOString()
  },
  { 
    id: 'OS-002', 
    customerName: 'Maria Souza', 
    customerPhone: '(11) 97777-6666', 
    deviceModel: 'Samsung S20', 
    issueDescription: 'Bateria não carrega', 
    status: 'in_progress', 
    partsUsed: [{ productId: '2', quantity: 1, costPrice: 80 }],
    laborCost: 80,
    totalPrice: 300,
    createdAt: subDays(new Date(), 1).toISOString(),
    updatedAt: subDays(new Date(), 1).toISOString()
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'services' | 'profit'>('dashboard');
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });
  const [services, setServices] = useState<ServiceOrder[]>(() => {
    const saved = localStorage.getItem('services');
    return saved ? JSON.parse(saved) : INITIAL_SERVICES;
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Persistence
  useEffect(() => {
    localStorage.setItem('products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('services', JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const stats = useMemo(() => {
    const totalRevenue = services
      .filter(s => s.status === 'delivered')
      .reduce((acc, s) => acc + s.totalPrice, 0);
    
    const totalCosts = services
      .filter(s => s.status === 'delivered')
      .reduce((acc, s) => {
        const partsCost = s.partsUsed.reduce((pAcc, p) => pAcc + (p.costPrice * p.quantity), 0);
        return acc + partsCost;
      }, 0);

    const pendingServices = services.filter(s => s.status !== 'delivered' && s.status !== 'cancelled').length;
    const lowStockItems = products.filter(p => p.stock <= p.minStock).length;

    return { totalRevenue, totalCosts, profit: totalRevenue - totalCosts, pendingServices, lowStockItems };
  }, [services, products]);

  // Navigation Items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Estoque', icon: Package },
    { id: 'services', label: 'Serviços', icon: Wrench },
    { id: 'profit', label: 'Análise de Lucro', icon: TrendingUp },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <aside className={cn(
        "bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col",
        isSidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="p-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Smartphone size={24} />
          </div>
          {isSidebarOpen && <h1 className="font-bold text-xl tracking-tight">ConsertaSmart</h1>}
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all group",
                activeTab === item.id 
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300 font-semibold shadow-sm" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
              )}
            >
              <item.icon size={20} className={cn(
                "transition-colors",
                activeTab === item.id ? "text-blue-600 dark:text-blue-300" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-200"
              )} />
              {isSidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label={isSidebarOpen ? 'Recolher menu lateral' : 'Expandir menu lateral'}
            className="w-full flex items-center justify-center p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {navItems.find(i => i.id === activeTab)?.label}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Bem-vindo ao seu painel de controle.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setTheme(current => current === 'light' ? 'dark' : 'light')}
              aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              <span>{theme === 'light' ? 'Modo escuro' : 'Modo claro'}</span>
            </button>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-4 py-2 flex items-center gap-2 shadow-sm">
              <Clock size={16} className="text-slate-400 dark:text-slate-500" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {format(new Date(), "eeee, d 'de' MMMM", { locale: ptBR })}
              </span>
            </div>
          </div>
        </header>

        {activeTab === 'dashboard' && <DashboardView stats={stats} services={services} products={products} theme={theme} />}
        {activeTab === 'inventory' && <InventoryView products={products} setProducts={setProducts} />}
        {activeTab === 'services' && <ServicesView services={services} setServices={setServices} products={products} setProducts={setProducts} />}
        {activeTab === 'profit' && <ProfitAnalysisView services={services} />}
      </main>
    </div>
  );
}

// --- VIEW COMPONENTS ---

function DashboardView({ stats, services, products, theme }: { stats: any, services: ServiceOrder[], products: Product[], theme: ThemeMode }) {
  const chartData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dayStr = format(date, 'dd/MM');
      const dayRevenue = services
        .filter(s => s.status === 'delivered' && format(new Date(s.updatedAt), 'dd/MM') === dayStr)
        .reduce((acc, s) => acc + s.totalPrice, 0);
      return { name: dayStr, revenue: dayRevenue };
    });
  }, [services]);

  const statusData = useMemo(() => {
    const counts = services.reduce((acc: any, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {});
    return [
      { name: 'Pendente', value: counts['pending'] || 0, color: '#94a3b8' },
      { name: 'Em Conserto', value: counts['in_progress'] || 0, color: '#3b82f6' },
      { name: 'Pronto', value: counts['ready'] || 0, color: '#10b981' },
      { name: 'Entregue', value: counts['delivered'] || 0, color: '#6366f1' },
    ].filter(d => d.value > 0);
  }, [services]);

  const chartTheme = useMemo(() => {
    return theme === 'dark'
      ? {
          grid: '#1e293b',
          tick: '#94a3b8',
          tooltipCursor: '#172033',
          tooltipStyle: {
            borderRadius: '12px',
            border: '1px solid #1e293b',
            backgroundColor: '#0f172a',
            color: '#e2e8f0',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.35)'
          }
        }
      : {
          grid: '#f1f5f9',
          tick: '#64748b',
          tooltipCursor: '#f8fafc',
          tooltipStyle: {
            borderRadius: '12px',
            border: 'none',
            backgroundColor: '#ffffff',
            color: '#0f172a',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
          }
        };
  }, [theme]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Receita Total" 
          value={formatCurrency(stats.totalRevenue)} 
          icon={DollarSign} 
          color="blue" 
          trend="+12.5%" 
        />
        <StatCard 
          title="Lucro Líquido" 
          value={formatCurrency(stats.profit)} 
          icon={TrendingUp} 
          color="emerald" 
          trend="+8.2%" 
        />
        <StatCard 
          title="Serviços Pendentes" 
          value={stats.pendingServices.toString()} 
          icon={Clock} 
          color="amber" 
        />
        <StatCard 
          title="Estoque Baixo" 
          value={stats.lowStockItems.toString()} 
          icon={AlertTriangle} 
          color="rose" 
          isWarning={stats.lowStockItems > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className={cn("lg:col-span-2 p-6 rounded-2xl", panelClass)}>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-600" />
            Faturamento (Últimos 7 dias)
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: chartTheme.tick, fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: chartTheme.tick, fontSize: 12 }} tickFormatter={(v) => `R$${v}`} />
                <Tooltip 
                  cursor={{ fill: chartTheme.tooltipCursor }}
                  contentStyle={chartTheme.tooltipStyle}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={cn("p-6 rounded-2xl", panelClass)}>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6">Status dos Serviços</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTheme.tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm text-slate-900 dark:text-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 dark:text-slate-300">{item.name}</span>
                </div>
                <span className="font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function InventoryView({ products, setProducts }: { products: Product[], setProducts: React.Dispatch<React.SetStateAction<Product[]>> }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    costPrice: '',
    salePrice: '',
    stock: '',
    minStock: ''
  });

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        category: product.category,
        costPrice: product.costPrice.toString(),
        salePrice: product.salePrice.toString(),
        stock: product.stock.toString(),
        minStock: product.minStock.toString()
      });
    } else {
      setEditingProduct(null);
      setFormData({ name: '', category: '', costPrice: '', salePrice: '', stock: '', minStock: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: Product = {
      id: editingProduct ? editingProduct.id : Math.random().toString(36).substr(2, 9),
      name: formData.name,
      category: formData.category,
      costPrice: parseFloat(formData.costPrice),
      salePrice: parseFloat(formData.salePrice),
      stock: parseInt(formData.stock),
      minStock: parseInt(formData.minStock)
    };

    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? newProduct : p));
    } else {
      setProducts(prev => [...prev, newProduct]);
    }
    setIsModalOpen(false);
  };

  const deleteProduct = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Buscar produtos..." 
            className={cn(inputClass, "pl-10 pr-4 py-2 shadow-sm")}
          />
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-md shadow-blue-100"
        >
          <Plus size={20} />
          Novo Produto
        </button>
      </div>

      <div className={cn("rounded-2xl overflow-hidden", panelClass)}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
              <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Produto</th>
              <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Categoria</th>
              <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Preço Custo</th>
              <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Preço Venda</th>
              <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Estoque</th>
              <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors group">
                <td className="p-4">
                  <div className="font-bold text-slate-900 dark:text-slate-100">{product.name}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">ID: {product.id}</div>
                </td>
                <td className="p-4">
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-medium">
                    {product.category}
                  </span>
                </td>
                <td className="p-4 font-medium text-slate-600 dark:text-slate-300">{formatCurrency(product.costPrice)}</td>
                <td className="p-4 font-bold text-blue-600">{formatCurrency(product.salePrice)}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-bold",
                      product.stock <= product.minStock ? "text-rose-600" : "text-slate-900 dark:text-slate-100"
                    )}>
                      {product.stock}
                    </span>
                    {product.stock <= product.minStock && (
                      <AlertTriangle size={14} className="text-rose-500" />
                    )}
                  </div>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenModal(product)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => deleteProduct(product.id)} className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Nome do Produto</label>
                  <input 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Categoria</label>
                  <input 
                    required
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Estoque Atual</label>
                  <input 
                    required
                    type="number"
                    value={formData.stock}
                    onChange={e => setFormData({...formData, stock: e.target.value})}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Preço Custo (R$)</label>
                  <input 
                    required
                    type="number"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={e => setFormData({...formData, costPrice: e.target.value})}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Preço Venda (R$)</label>
                  <input 
                    required
                    type="number"
                    step="0.01"
                    value={formData.salePrice}
                    onChange={e => setFormData({...formData, salePrice: e.target.value})}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-lg shadow-blue-100"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ServicesView({ services, setServices, products, setProducts }: { 
  services: ServiceOrder[], 
  setServices: React.Dispatch<React.SetStateAction<ServiceOrder[]>>,
  products: Product[],
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    deviceModel: '',
    issueDescription: '',
    laborCost: '',
    selectedPartId: '',
    partQuantity: '1'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedPart = products.find(p => p.id === formData.selectedPartId);
    const partsUsed = selectedPart ? [{
      productId: selectedPart.id,
      quantity: parseInt(formData.partQuantity),
      costPrice: selectedPart.costPrice
    }] : [];

    const totalPrice = parseFloat(formData.laborCost) + (selectedPart ? selectedPart.salePrice * parseInt(formData.partQuantity) : 0);

    const newService: ServiceOrder = {
      id: `OS-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      deviceModel: formData.deviceModel,
      issueDescription: formData.issueDescription,
      status: 'pending',
      partsUsed,
      laborCost: parseFloat(formData.laborCost),
      totalPrice,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Update stock if part used
    if (selectedPart) {
      setProducts(prev => prev.map(p => 
        p.id === selectedPart.id 
          ? { ...p, stock: p.stock - parseInt(formData.partQuantity) } 
          : p
      ));
    }

    setServices(prev => [newService, ...prev]);
    setIsModalOpen(false);
    setFormData({ customerName: '', customerPhone: '', deviceModel: '', issueDescription: '', laborCost: '', selectedPartId: '', partQuantity: '1' });
  };

  const updateStatus = (id: string, newStatus: ServiceStatus) => {
    setServices(prev => prev.map(s => 
      s.id === id ? { ...s, status: newStatus, updatedAt: new Date().toISOString() } : s
    ));
  };

  const getStatusBadge = (status: ServiceStatus) => {
    switch (status) {
      case 'pending': return <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-bold">Pendente</span>;
      case 'in_progress': return <span className="bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-bold">Em Conserto</span>;
      case 'ready': return <span className="bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-bold">Pronto</span>;
      case 'delivered': return <span className="bg-indigo-100 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 px-3 py-1 rounded-full text-xs font-bold">Entregue</span>;
      case 'cancelled': return <span className="bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 px-3 py-1 rounded-full text-xs font-bold">Cancelado</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <button className={secondaryButtonClass}>Todos</button>
          <button className={secondaryButtonClass}>Pendentes</button>
          <button className={secondaryButtonClass}>Prontos</button>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
        >
          <Plus size={20} />
          Nova Ordem de Serviço
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {services.map((service) => (
          <div key={service.id} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-200 dark:hover:border-blue-500/30 transition-all group">
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl text-slate-400 dark:text-slate-500 group-hover:text-blue-500 transition-colors">
                  <Smartphone size={32} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">{service.deviceModel}</h4>
                    {getStatusBadge(service.status)}
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Cliente: <span className="font-semibold text-slate-700 dark:text-slate-200">{service.customerName}</span> • {service.customerPhone}</p>
                  <div className="mt-3 flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
                    <span className="flex items-center gap-1"><Clock size={14} /> {format(new Date(service.createdAt), 'dd/MM/yyyy HH:mm')}</span>
                    <span className="font-mono font-bold text-slate-500 dark:text-slate-400">{service.id}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{formatCurrency(service.totalPrice)}</div>
                <div className="mt-4 flex gap-2 justify-end">
                  {service.status === 'pending' && (
                    <button 
                      onClick={() => updateStatus(service.id, 'in_progress')}
                      className="bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-300 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                    >
                      Iniciar Conserto
                    </button>
                  )}
                  {service.status === 'in_progress' && (
                    <button 
                      onClick={() => updateStatus(service.id, 'ready')}
                      className="bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                    >
                      Marcar como Pronto
                    </button>
                  )}
                  {service.status === 'ready' && (
                    <button 
                      onClick={() => updateStatus(service.id, 'delivered')}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700"
                    >
                      Entregar ao Cliente
                    </button>
                  )}
                  <button className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <Edit2 size={18} />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/70 -mx-6 -mb-6 px-6 py-4 rounded-b-2xl">
              <div className="text-sm text-slate-600 dark:text-slate-300 italic">"{service.issueDescription}"</div>
              <div className="flex gap-4">
                {service.status === 'ready' && (
                  <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold animate-pulse">
                    <CheckCircle size={14} />
                    Aguardando retirada
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Nova Ordem de Serviço</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Nome do Cliente</label>
                  <input 
                    required
                    value={formData.customerName}
                    onChange={e => setFormData({...formData, customerName: e.target.value})}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Telefone</label>
                  <input 
                    required
                    value={formData.customerPhone}
                    onChange={e => setFormData({...formData, customerPhone: e.target.value})}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Modelo do Aparelho</label>
                  <input 
                    required
                    value={formData.deviceModel}
                    onChange={e => setFormData({...formData, deviceModel: e.target.value})}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Mão de Obra (R$)</label>
                  <input 
                    required
                    type="number"
                    value={formData.laborCost}
                    onChange={e => setFormData({...formData, laborCost: e.target.value})}
                    className={inputClass}
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Descrição do Problema</label>
                  <textarea 
                    required
                    rows={2}
                    value={formData.issueDescription}
                    onChange={e => setFormData({...formData, issueDescription: e.target.value})}
                    className={inputClass}
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Peça Utilizada (Opcional)</label>
                  <select 
                    value={formData.selectedPartId}
                    onChange={e => setFormData({...formData, selectedPartId: e.target.value})}
                    className={inputClass}
                  >
                    <option value="">Nenhuma peça</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} - {formatCurrency(p.salePrice)} (Estoque: {p.stock})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-lg shadow-blue-100"
                >
                  Gerar OS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfitAnalysisView({ services }: { services: ServiceOrder[] }) {
  const profitData = useMemo(() => {
    return services.map(s => {
      const partsCost = s.partsUsed.reduce((acc, p) => acc + (p.costPrice * p.quantity), 0);
      const profit = s.totalPrice - partsCost;
      const margin = (profit / s.totalPrice) * 100;
      return { ...s, partsCost, profit, margin };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [services]);

  return (
    <div className="space-y-6">
      <div className={cn("rounded-2xl overflow-hidden", panelClass)}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
              <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Serviço / OS</th>
              <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Valor Cobrado</th>
              <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Custo Peças</th>
              <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Lucro Bruto</th>
              <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Margem</th>
            </tr>
          </thead>
          <tbody>
            {profitData.map((item) => (
              <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors">
                <td className="p-4">
                  <div className="font-bold text-slate-900 dark:text-slate-100">{item.deviceModel}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">{item.id} • {item.customerName}</div>
                </td>
                <td className="p-4 font-bold text-slate-900 dark:text-slate-100">{formatCurrency(item.totalPrice)}</td>
                <td className="p-4 text-rose-600 font-medium">-{formatCurrency(item.partsCost)}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2 text-emerald-600 font-black">
                    {formatCurrency(item.profit)}
                    <ArrowUpRight size={14} />
                  </div>
                </td>
                <td className="p-4">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden max-w-[100px]">
                    <div 
                      className="bg-emerald-500 h-full rounded-full" 
                      style={{ width: `${Math.min(item.margin, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 block">{item.margin.toFixed(1)}% de margem</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- HELPERS ---

function StatCard({ title, value, icon: Icon, color, trend, isWarning }: any) {
  const colors: any = {
    blue: "bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-100 dark:border-blue-500/20",
    emerald: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-100 dark:border-emerald-500/20",
    amber: "bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-100 dark:border-amber-500/20",
    rose: "bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-100 dark:border-rose-500/20",
  };

  return (
    <div className={cn(
      "bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md",
      isWarning && "border-rose-200 dark:border-rose-500/30 bg-rose-50/30 dark:bg-rose-500/10"
    )}>
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-3 rounded-xl border", colors[color])}>
          <Icon size={24} />
        </div>
        {trend && (
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 px-2 py-1 rounded-lg">
            {trend}
          </span>
        )}
      </div>
      <h4 className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</h4>
      <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{value}</div>
    </div>
  );
}
