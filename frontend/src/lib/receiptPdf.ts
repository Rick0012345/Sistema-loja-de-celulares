export type ReceiptSaleItem = {
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type ReceiptSale = {
  reference: string;
  customerName: string;
  paymentMethodLabel: string;
  total: number;
  createdAt: string;
  items: ReceiptSaleItem[];
};

export type ReceiptServicePart = {
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type ReceiptServiceOrder = {
  id: string;
  customerName: string;
  customerPhone: string;
  deviceBrand: string;
  deviceModel: string;
  deliveryTypeLabel: string;
  statusLabel: string;
  issueDescription: string;
  laborCost: number;
  total: number;
  createdAt: string;
  parts: ReceiptServicePart[];
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export const emitReceiptPdf = (sale: ReceiptSale) => {
  const popup = window.open('', '_blank', 'width=860,height=640');

  if (!popup) {
    throw new Error('Nao foi possivel abrir a janela de impressao do recibo.');
  }

  const issuedAt = new Date(sale.createdAt).toLocaleString('pt-BR');

  const itemsRows = sale.items
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.productName)}</td>
          <td>${item.quantity}</td>
          <td>${formatCurrency(item.unitPrice)}</td>
          <td>${formatCurrency(item.subtotal)}</td>
        </tr>
      `,
    )
    .join('');

  const html = `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Recibo ${escapeHtml(sale.reference)}</title>
        <style>
          :root {
            color-scheme: light;
            font-family: 'Segoe UI', Arial, sans-serif;
          }

          body {
            margin: 0;
            padding: 30px;
            color: #0f172a;
            background: #ffffff;
          }

          .receipt {
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 24px;
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 16px;
            margin-bottom: 22px;
          }

          .title {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
          }

          .subtitle {
            margin: 6px 0 0;
            font-size: 13px;
            color: #475569;
          }

          .meta {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px 18px;
            margin-bottom: 20px;
            font-size: 13px;
          }

          .meta dt {
            color: #475569;
            margin-bottom: 4px;
            font-weight: 600;
          }

          .meta dd {
            margin: 0;
            font-weight: 600;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 18px;
            font-size: 13px;
          }

          th,
          td {
            border-bottom: 1px solid #e2e8f0;
            padding: 10px 8px;
            text-align: left;
          }

          th {
            background: #f8fafc;
            font-weight: 700;
          }

          .total {
            text-align: right;
            font-size: 18px;
            font-weight: 700;
          }

          .footer {
            margin-top: 22px;
            font-size: 12px;
            color: #64748b;
          }

          @media print {
            body {
              padding: 0;
            }

            .receipt {
              border: none;
              border-radius: 0;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <section class="receipt">
          <header class="header">
            <div>
              <h1 class="title">Recibo de Venda</h1>
              <p class="subtitle">Sistema de Loja de Celular</p>
            </div>
            <div>
              <p class="subtitle"><strong>Ref:</strong> ${escapeHtml(sale.reference)}</p>
              <p class="subtitle"><strong>Data:</strong> ${escapeHtml(issuedAt)}</p>
            </div>
          </header>

          <dl class="meta">
            <div>
              <dt>Cliente</dt>
              <dd>${escapeHtml(sale.customerName)}</dd>
            </div>
            <div>
              <dt>Forma de Pagamento</dt>
              <dd>${escapeHtml(sale.paymentMethodLabel)}</dd>
            </div>
          </dl>

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qtd.</th>
                <th>Valor Unitario</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <p class="total">Total: ${formatCurrency(sale.total)}</p>

          <p class="footer">
            Recibo gerado eletronicamente pelo sistema.
          </p>
        </section>
      </body>
    </html>
  `;

  popup.document.open();
  popup.document.write(html);
  popup.document.close();

  popup.onload = () => {
    popup.focus();
    popup.print();
  };
};

export const emitServiceOrderReceiptPdf = (service: ReceiptServiceOrder) => {
  const popup = window.open('', '_blank', 'width=860,height=700');

  if (!popup) {
    throw new Error('Nao foi possivel abrir a janela de impressao do recibo da OS.');
  }

  const issuedAt = new Date(service.createdAt).toLocaleString('pt-BR');
  const partsTotal = service.parts.reduce((sum, part) => sum + part.subtotal, 0);

  const partsRows =
    service.parts.length === 0
      ? `
        <tr>
          <td colspan="4">Nenhuma peca vinculada.</td>
        </tr>
      `
      : service.parts
          .map(
            (part) => `
            <tr>
              <td>${escapeHtml(part.description)}</td>
              <td>${part.quantity}</td>
              <td>${formatCurrency(part.unitPrice)}</td>
              <td>${formatCurrency(part.subtotal)}</td>
            </tr>
          `,
          )
          .join('');

  const html = `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Recibo OS ${escapeHtml(service.id)}</title>
        <style>
          :root {
            color-scheme: light;
            font-family: 'Segoe UI', Arial, sans-serif;
          }
          body {
            margin: 0;
            padding: 30px;
            color: #0f172a;
            background: #ffffff;
          }
          .receipt {
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 24px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 16px;
            margin-bottom: 18px;
          }
          .title {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
          }
          .subtitle {
            margin: 6px 0 0;
            font-size: 13px;
            color: #475569;
          }
          .meta {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px 18px;
            margin-bottom: 16px;
            font-size: 13px;
          }
          .meta dt {
            color: #475569;
            margin-bottom: 4px;
            font-weight: 600;
          }
          .meta dd {
            margin: 0;
            font-weight: 600;
          }
          .issue-box {
            margin: 0 0 16px;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 10px 12px;
            font-size: 13px;
            background: #f8fafc;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
            font-size: 13px;
          }
          th,
          td {
            border-bottom: 1px solid #e2e8f0;
            padding: 10px 8px;
            text-align: left;
          }
          th {
            background: #f8fafc;
            font-weight: 700;
          }
          .totals {
            margin-top: 8px;
            font-size: 14px;
          }
          .totals p {
            display: flex;
            justify-content: space-between;
            margin: 6px 0;
          }
          .totals .grand {
            font-size: 18px;
            font-weight: 700;
          }
          .footer {
            margin-top: 18px;
            font-size: 12px;
            color: #64748b;
          }
          @media print {
            body { padding: 0; }
            .receipt {
              border: none;
              border-radius: 0;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <section class="receipt">
          <header class="header">
            <div>
              <h1 class="title">Recibo de Ordem de Servico</h1>
              <p class="subtitle">Sistema de Loja de Celular</p>
            </div>
            <div>
              <p class="subtitle"><strong>OS:</strong> ${escapeHtml(service.id)}</p>
              <p class="subtitle"><strong>Data:</strong> ${escapeHtml(issuedAt)}</p>
            </div>
          </header>

          <dl class="meta">
            <div>
              <dt>Cliente</dt>
              <dd>${escapeHtml(service.customerName)}</dd>
            </div>
            <div>
              <dt>Telefone</dt>
              <dd>${escapeHtml(service.customerPhone || '-')}</dd>
            </div>
            <div>
              <dt>Aparelho</dt>
              <dd>${escapeHtml(`${service.deviceBrand} ${service.deviceModel}`)}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>${escapeHtml(service.statusLabel)}</dd>
            </div>
            <div>
              <dt>Entrega</dt>
              <dd>${escapeHtml(service.deliveryTypeLabel)}</dd>
            </div>
          </dl>

          <p class="issue-box"><strong>Defeito relatado:</strong> ${escapeHtml(service.issueDescription)}</p>

          <table>
            <thead>
              <tr>
                <th>Peca/Item</th>
                <th>Qtd.</th>
                <th>Valor Unitario</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${partsRows}
            </tbody>
          </table>

          <div class="totals">
            <p><span>Subtotal pecas:</span> <strong>${formatCurrency(partsTotal)}</strong></p>
            <p><span>Mao de obra:</span> <strong>${formatCurrency(service.laborCost)}</strong></p>
            <p class="grand"><span>Total:</span> <strong>${formatCurrency(service.total)}</strong></p>
          </div>

          <p class="footer">Recibo gerado eletronicamente pelo sistema.</p>
        </section>
      </body>
    </html>
  `;

  popup.document.open();
  popup.document.write(html);
  popup.document.close();

  popup.onload = () => {
    popup.focus();
    popup.print();
  };
};
