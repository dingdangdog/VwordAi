import { describe, expect, test } from "vitest";
import { formatPrice, periodLine, planFeatures } from "./billing";

describe("planFeatures", () => {
  test("按行拆开并去掉列表符号", () => {
    expect(planFeatures("- 每月发放\n• 当月不结转")).toEqual(["每月发放", "当月不结转"]);
  });

  test("一整段按句号和分号拆开", () => {
    expect(planFeatures("适合日常更新。额度按月发放；当月不结转")).toEqual(["适合日常更新", "额度按月发放", "当月不结转"]);
  });

  test("空说明没有特点", () => {
    expect(planFeatures("  ")).toEqual([]);
    expect(planFeatures(null)).toEqual([]);
  });
});

describe("formatPrice", () => {
  test("V豆按整数展示", () => {
    expect(formatPrice(1280, "VPT")).toBe("1,280 V豆");
    expect(formatPrice(null, "VPT")).toBe("");
  });

  test("人民币按分换算", () => {
    expect(formatPrice(19900, "CNY")).toContain("199");
  });
});

describe("periodLine", () => {
  test("支付渠道订阅和 V豆 周期文案不同", () => {
    const end = "2026-12-01T00:00:00.000Z";
    expect(periodLine({ managedByStripe: true, cancelAtPeriodEnd: false, currentPeriodEnd: end })).toContain("续订");
    expect(periodLine({ managedByStripe: true, cancelAtPeriodEnd: true, currentPeriodEnd: end })).toContain("不再续订");
    expect(periodLine({ managedByStripe: false, currentPeriodEnd: end })).toContain("到期");
    expect(periodLine({ managedByStripe: false, currentPeriodEnd: end })).not.toContain("续订");
  });
});
