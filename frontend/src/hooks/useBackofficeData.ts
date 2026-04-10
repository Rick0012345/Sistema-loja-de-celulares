import { useCallback, useMemo, useState } from 'react';
import { api, UnauthorizedError } from '../lib/api';
import {
  Customer,
  DashboardSummary,
  FinancialReport,
  NotificationItem,
  PaymentMethod,
  Product,
  ProductFormValues,
  Sale,
  SaleFormValues,
  ServiceFormValues,
  ServiceOrder,
  ServiceStatus,
  Supplier,
  SupplierFormValues,
} from '../types';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Nao foi possivel concluir a operacao.';

const normalizePhone = (phone: string) => phone.replace(/\D/g, '');

const parseInteger = (value: string) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseDecimal = (value: string) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeOptionalString = (value: string) => {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const buildServiceItemsPayload = (values: ServiceFormValues) =>
  values.parts
    .map((part) => ({
      produto_id: part.productId || undefined,
      descricao_item: part.description.trim() || undefined,
      quantidade: Math.max(parseInteger(part.quantity), 1),
      custo_unitario: parseDecimal(part.costPrice),
      venda_unitaria: parseDecimal(part.salePrice),
    }))
    .filter((part) => part.produto_id || part.descricao_item);

type UseBackofficeDataOptions = {
  onUnauthorized: (message: string) => Promise<void>;
  onAfterUnauthorizedReset?: () => void;
};

export const useBackofficeData = ({
  onUnauthorized,
  onAfterUnauthorizedReset,
}: UseBackofficeDataOptions) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<ServiceOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [financialReport, setFinancialReport] = useState<FinancialReport | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetData = useCallback(() => {
    setProducts([]);
    setServices([]);
    setCustomers([]);
    setSales([]);
    setSuppliers([]);
    setNotifications([]);
    setDashboardSummary(null);
    setFinancialReport(null);
    setIsLoading(false);
    onAfterUnauthorizedReset?.();
  }, [onAfterUnauthorizedReset]);

  const loadAppData = useCallback(
    async (showLoader = true) => {
      if (showLoader) {
        setIsLoading(true);
      }

      try {
        const [
          nextProducts,
          nextServices,
          nextCustomers,
          nextDashboardSummary,
          nextSales,
          nextSuppliers,
          nextFinancialReport,
          nextNotifications,
        ] =
          await Promise.all([
            api.listProducts(),
            api.listServices(),
            api.listCustomers(),
            api.getDashboardSummary(),
            api.listSales(),
            api.listSuppliers(),
            api.getFinancialReport(),
            api.listNotifications(),
          ]);

        setProducts(nextProducts);
        setServices(nextServices);
        setCustomers(nextCustomers);
        setDashboardSummary(nextDashboardSummary);
        setSales(nextSales);
        setSuppliers(nextSuppliers);
        setFinancialReport(nextFinancialReport);
        setNotifications(nextNotifications);
        setErrorMessage(null);
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          await onUnauthorized(error.message);
          return;
        }

        setErrorMessage(getErrorMessage(error));
      } finally {
        if (showLoader) {
          setIsLoading(false);
        }
      }
    },
    [onUnauthorized],
  );

  const runMutation = useCallback(
    async (action: () => Promise<void>) => {
      setIsMutating(true);
      setErrorMessage(null);

      try {
        await action();
        await loadAppData(false);
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          await onUnauthorized(error.message);
          return;
        }

        setErrorMessage(getErrorMessage(error));
      } finally {
        setIsMutating(false);
      }
    },
    [loadAppData, onUnauthorized],
  );

  const saveProduct = useCallback(
    async (values: ProductFormValues, product?: Product | null) => {
      const inventoryType: 'manutencao' | 'venda' =
        values.inventoryType === 'repair' ? 'manutencao' : 'venda';

      const payload = {
        nome: values.name.trim(),
        marca: values.brand.trim() || undefined,
        modelo_compatavel: values.compatibleModel.trim() || undefined,
        sku: values.sku.trim() || undefined,
        tipo_estoque: inventoryType,
        fornecedor_id: values.supplierId || undefined,
        estoque_minimo: parseInteger(values.minStock),
        preco_custo: parseDecimal(values.costPrice),
        preco_venda: parseDecimal(values.salePrice),
      };

      await runMutation(async () => {
        if (product) {
          await api.updateProduct(product.id, {
            ...payload,
            quantidade_estoque: parseInteger(values.stock),
          });
          return;
        }

        await api.createProduct({
          ...payload,
          quantidade_inicial: parseInteger(values.stock),
        });
      });
    },
    [runMutation],
  );

  const deleteProduct = useCallback(
    async (product: Product) => {
      if (!window.confirm(`Deseja desativar o produto "${product.name}"?`)) {
        return;
      }

      await runMutation(async () => {
        await api.deleteProduct(product.id);
      });
    },
    [runMutation],
  );

  const resolveCustomer = useCallback(
    async (values: ServiceFormValues) => {
      const phone = normalizePhone(values.customerPhone);
      let customer = customers.find((item) => normalizePhone(item.phone) === phone) ?? null;

      if (!customer) {
        customer = await api.createCustomer({
          nome: values.customerName.trim(),
          telefone: values.customerPhone.trim(),
        });
      }

      return customer;
    },
    [customers],
  );

  const createService = useCallback(
    async (values: ServiceFormValues) => {
      await runMutation(async () => {
        const customer = await resolveCustomer(values);
        const itens = buildServiceItemsPayload(values);

        await api.createService({
          cliente_id: customer.id,
          aparelho_marca: values.deviceBrand.trim(),
          aparelho_modelo: values.deviceModel.trim(),
          defeito_relatado: values.issueDescription.trim(),
          termo_responsabilidade_aceito: true,
          tipo_entrega:
            values.deliveryType === 'delivery' ? 'entrega' : 'retirada_loja',
          valor_mao_de_obra: parseDecimal(values.laborCost),
          itens: itens.length ? itens : undefined,
        });
      });
    },
    [resolveCustomer, runMutation],
  );

  const updateService = useCallback(
    async (serviceId: string, values: ServiceFormValues) => {
      await runMutation(async () => {
        const customer = await resolveCustomer(values);
        const itens = buildServiceItemsPayload(values);

        await api.updateService(serviceId, {
          cliente_id: customer.id,
          aparelho_marca: values.deviceBrand.trim(),
          aparelho_modelo: values.deviceModel.trim(),
          defeito_relatado: values.issueDescription.trim(),
          tipo_entrega:
            values.deliveryType === 'delivery' ? 'entrega' : 'retirada_loja',
          valor_mao_de_obra: parseDecimal(values.laborCost),
          itens,
        });
      });
    },
    [resolveCustomer, runMutation],
  );

  const updateServiceStatus = useCallback(
    async (
      serviceId: string,
      input: {
        status: ServiceStatus;
        paymentMethod?: PaymentMethod;
        note?: string;
      },
    ) => {
      await runMutation(async () => {
        await api.updateServiceStatus(serviceId, {
          status: input.status,
          meio_pagamento: input.paymentMethod,
          observacao: input.note,
        });
      });
    },
    [runMutation],
  );

  const createSale = useCallback(
    async (values: SaleFormValues) => {
      await runMutation(async () => {
        if (!values.items.length) {
          throw new Error('Adicione pelo menos um produto para registrar a venda.');
        }

        const groupedItems = values.items.reduce<Record<string, number>>((acc, item) => {
          const quantity = Math.max(parseInteger(item.quantity), 1);
          acc[item.productId] = (acc[item.productId] ?? 0) + quantity;
          return acc;
        }, {});

        const payloadItems = Object.entries(groupedItems).map(([productId, quantity]) => {
          const selectedProduct = products.find((product) => product.id === productId);
          if (!selectedProduct) {
            throw new Error('Um dos produtos selecionados nao e valido.');
          }
          if (quantity > selectedProduct.stock) {
            throw new Error(`Quantidade acima do estoque para "${selectedProduct.name}".`);
          }
          return { produto_id: productId, quantidade: quantity };
        });

        await api.createSale({
          cliente_nome: values.customerName.trim() || undefined,
          meio_pagamento: values.paymentMethod,
          itens: payloadItems,
        });
      });
    },
    [products, runMutation],
  );

  const markNotificationAsRead = useCallback(
    async (id: string) => {
      await runMutation(async () => {
        await api.markNotificationAsRead(id);
      });
    },
    [runMutation],
  );

  const markAllNotificationsAsRead = useCallback(async () => {
    await runMutation(async () => {
      await api.markAllNotificationsAsRead();
    });
  }, [runMutation]);

  const saveSupplier = useCallback(
    async (values: SupplierFormValues, supplier?: Supplier | null) => {
      await runMutation(async () => {
        const payload = {
          nome: values.name.trim(),
          telefone: normalizeOptionalString(values.phone),
          whatsapp: normalizeOptionalString(values.whatsapp),
          email: normalizeOptionalString(values.email),
          documento: normalizeOptionalString(values.document),
          cidade: normalizeOptionalString(values.city),
          observacoes: normalizeOptionalString(values.notes),
          ativo: values.isActive,
        };

        if (supplier) {
          await api.updateSupplier(supplier.id, payload);
          return;
        }

        await api.createSupplier(payload);
      });
    },
    [runMutation],
  );

  const deleteSupplier = useCallback(
    async (supplier: Supplier) => {
      if (!window.confirm(`Deseja inativar o fornecedor "${supplier.name}"?`)) {
        return;
      }

      await runMutation(async () => {
        await api.deleteSupplier(supplier.id);
      });
    },
    [runMutation],
  );

  const retryWebhook = useCallback(
    async (serviceId: string) => {
      await runMutation(async () => {
        await api.retryOrderWebhook(serviceId);
      });
    },
    [runMutation],
  );

  const refreshFinancialReport = useCallback(
    async (input?: { days?: number; origin?: 'todas' | 'ordem_servico' | 'venda' }) => {
      try {
        const report = await api.getFinancialReport(input);
        setFinancialReport(report);
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          await onUnauthorized(error.message);
          return;
        }

        setErrorMessage(getErrorMessage(error));
      }
    },
    [onUnauthorized],
  );

  const stats = useMemo(() => {
    const deliveredServices = services.filter((service) => service.status === 'entregue');
    const totalRevenue = deliveredServices.reduce((acc, service) => acc + service.totalPrice, 0);
    const totalCosts = deliveredServices.reduce(
      (acc, service) =>
        acc +
        service.partsUsed.reduce(
          (partsAcc, part) => partsAcc + part.costPrice * part.quantity,
          0,
        ),
      0,
    );

    return {
      totalRevenue,
      totalCosts,
      profit: totalRevenue - totalCosts,
      pendingServices: services.filter(
        (service) => service.status !== 'entregue' && service.status !== 'cancelada',
      ).length,
      lowStockItems: products.filter((product) => product.isLowStock).length,
    };
  }, [products, services]);

  return {
    products,
    services,
    sales,
    suppliers,
    customers,
    dashboardSummary,
    financialReport,
    notifications,
    isLoading,
    isMutating,
    errorMessage,
    setErrorMessage,
    stats,
    loadAppData,
    resetData,
    saveProduct,
    deleteProduct,
    saveSupplier,
    deleteSupplier,
    createService,
    updateService,
    createSale,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    updateServiceStatus,
    retryWebhook,
    refreshFinancialReport,
  };
};
