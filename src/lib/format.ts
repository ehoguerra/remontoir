const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export const formatPrice = (value: number) => brl.format(value);

export const installments = (value: number, times = 10) =>
  `ou ${times}x de ${new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / times)} sem juros`;
