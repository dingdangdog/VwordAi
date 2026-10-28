/** 与网站订阅页一致：一行一条；旧数据仍是一整段时按句号和分号拆开。 */
export function planFeatures(description: string | null | undefined): string[] {
  const text = description?.trim() || "";
  if (!text) return [];
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);
  if (lines.length > 1) return lines;
  return text
    .split(/[。；;]/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/** 金额展示。V豆是整数；人民币沿用订单里的分。 */
export function formatPrice(amount: number | null | undefined, currency: string | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return "";
  if (!currency || currency === "VPT") return `${amount.toLocaleString("zh-CN")} V豆`;
  if (currency === "CNY") {
    return new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY" }).format(amount / 100);
  }
  return `${amount.toLocaleString("zh-CN")} ${currency}`;
}

export function formatBillingDate(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("zh-CN");
}

export function periodLine(item: {
  managedByStripe?: boolean;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: string | null;
}): string {
  const date = formatBillingDate(item.currentPeriodEnd);
  if (!date) return "";
  if (item.managedByStripe && !item.cancelAtPeriodEnd) return `将于 ${date} 续订`;
  if (item.managedByStripe) return `将于 ${date} 到期，不再续订`;
  return `将于 ${date} 到期`;
}
