import { useCallback, useMemo, useState } from 'react';
import { api, UnauthorizedError } from '../lib/api';
import {
  Customer,
  DashboardSummary,
  Product,
  ProductFormValues,
  Sale,
  SaleFormValues,
  ServiceFormValues,
  ServiceOrder,
  ServiceStatus,
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
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetData = useCallback(() => {
    setProducts([]);
    setServices([]);
    setCustomers([]);
    setSales([]);
    setDashboardSummary(null);
    setIsLoading(false);
    onAfterUnauthorizedReset?.();
  }, [onAfterUnauthorizedReset]);

  const loadAppData = useCallback(
    async (showLoader = true) => {
      if (showLoader) {
        setIsLoading(true);
      }

      try {
        const [nextProducts, nextServices, nextCustomers, nextDashboardSummary, nextSales] =
          await Promise.all([
            api.listProducts(),
            api.listServices(),
            api.listCustomers(),
            api.getDashboardSummary(),
            api.listSales(),
          ]);

        setProducts(nextProducts);
        setServices(nextServices);
        setCustomers(nextCustomers);
        setDashboardSummary(nextDashboardSummary);
        setSales(nextSales);
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
      const payload = {
        nome: values.name.trim(),
        marca: values.brand.trim() || undefined,
        modelo_compatavel: values.compatibleModel.trim() || undefined,
        sku: values.sku.trim() || undefined,
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

        const selectedPart = products.find((product) => product.id === values.selectedPartId);
        const partQuantity = Math.max(parseInteger(values.partQuantity), 1);

        await api.createService({
          cliente_id: customer.id,
          aparelho_marca: values.deviceBrand.trim(),
          aparelho_modelo: values.deviceModel.trim(),
          defeito_relatado: values.issueDescription.trim(),
          termo_responsabilidade_aceito: true,
          tipo_entrega:
            values.deliveryType === 'delivery' ? 'entrega' : 'retirada_loja',
          valor_mao_de_obra: parseDecimal(values.laborCost),
          itens: selectedPart
            ? [{ produto_id: selectedPart.id, quantidade: partQuantity }]
            : undefined,
        });
      });
    },
    [products, resolveCustomer, runMutation],
  );

  const updateService = useCallback(
    async (serviceId: string, values: ServiceFormValues) => {
      await runMutation(async () => {
        const customer = await resolveCustomer(values);
        const selectedPart = products.find((product) => product.id === values.selectedPartId);
        const partQuantity = Math.max(parseInteger(values.partQuantity), 1);

        await api.updateService(serviceId, {
          cliente_id: customer.id,
          aparelho_marca: values.deviceBrand.trim(),
          aparelho_modelo: values.deviceModel.trim(),
          defeito_relatado: values.issueDescription.trim(),
          tipo_entrega:
            values.deliveryType === 'delivery' ? 'entrega' : 'retirada_loja',
          valor_mao_de_obra: parseDecimal(values.laborCost),
          itens: selectedPart
            ? [{ produto_id: selectedPart.id, quantidade: partQuantity }]
            : [],
        });
      });
    },
    [products, resolveCustomer, runMutation],
  );

  const updateServiceStatus = useCallback(
    async (serviceId: string, status: ServiceStatus) => {
      await runMutation(async () => {
        await api.updateServiceStatus(serviceId, status);
      });
    },
    [runMutation],
  );

  const createSale = useCallback(
    async (values: SaleFormValues) => {
      await runMutation(async () => {
        const selectedProduct = products.find(
          (product) => product.id === values.selectedProductId,
        );

        if (!selectedProduct) {
          throw new Error('Selecione um produto válido para registrar a venda.');
        }

        const quantity = Math.max(parseInteger(values.quantity), 1);
        await api.createSale({
          cliente_nome: values.customerName.trim() || undefined,
          meio_pagamento: values.paymentMethod,
          itens: [{ produto_id: selectedProduct.id, quantidade: quantity }],
        });
      });
    },
    [products, runMutation],
  );

  const stats = useMemo(() => {
    const deliveredServices = services.filter((service) => service.status === 'delivered');
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
        (service) => service.status !== 'delivered' && service.status !== 'cancelled',
      ).length,
      lowStockItems: products.filter((product) => product.isLowStock).length,
    };
  }, [products, services]);

  return {
    products,
    services,
    sales,
    customers,
    dashboardSummary,
    isLoading,
    isMutating,
    errorMessage,
    setErrorMessage,
    stats,
    loadAppData,
    resetData,
    saveProduct,
    deleteProduct,
    createService,
    updateService,
    createSale,
    updateServiceStatus,
  };
};
