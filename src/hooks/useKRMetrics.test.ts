import { describe, it, expect } from "vitest";
import { calculateProgress, type KRMetricConfig, type KRMetricValue } from "./useKRMetrics";

const DAY = 1000 * 60 * 60 * 24;
const today = new Date();
const isoDate = (d: Date) => d.toISOString().slice(0, 10);

const startDate = isoDate(new Date(today.getTime() - 100 * DAY));
const endDate = isoDate(new Date(today.getTime() + 100 * DAY));
const todayStr = isoDate(today);

const baseConfig = {
  id: "c1",
  key_result_id: "kr1",
  metric_name: "Revenue",
  unit: "USD",
  start_date: startDate,
  end_date: endDate,
};

const value = (v: number, date = todayStr): KRMetricValue => ({
  id: "v" + v,
  kr_metric_config_id: "c1",
  date,
  value: v,
  created_by: null,
  created_at: new Date().toISOString(),
});

describe("calculateProgress", () => {
  it("returns no_config status when config is null", () => {
    const result = calculateProgress(null, []);
    expect(result.status).toBe("no_config");
    expect(result.currentValue).toBeNull();
    expect(result.progressPercent).toBe(0);
  });

  it("returns no_data status when config exists but no values", () => {
    const config: KRMetricConfig = {
      ...baseConfig,
      direction: "increase",
      start_value: 0,
      target_value: 100,
    };
    const result = calculateProgress(config, []);
    expect(result.status).toBe("no_data");
  });

  describe("increase direction", () => {
    const config: KRMetricConfig = {
      ...baseConfig,
      direction: "increase",
      start_value: 0,
      target_value: 100,
    };

    it("on_track when current value meets linear expectation", () => {
      const result = calculateProgress(config, [value(50)]);
      expect(result.progressPercent).toBeCloseTo(0.5, 1);
      expect(result.status).toBe("on_track");
    });

    it("off_track when current value is far below expectation", () => {
      const result = calculateProgress(config, [value(10)]);
      expect(result.status).toBe("off_track");
    });

    it("at_risk when slightly behind", () => {
      // expected ~0.5; actual 0.45 → gap 0.05, within 0.1 tolerance → at_risk
      const result = calculateProgress(config, [value(45)]);
      expect(result.status).toBe("at_risk");
    });

    it("clamps progress to 1 when current value exceeds target", () => {
      const result = calculateProgress(config, [value(150)]);
      expect(result.progressPercent).toBe(1);
    });

    it("clamps progress to 0 when current value is below start", () => {
      const result = calculateProgress(config, [value(-10)]);
      expect(result.progressPercent).toBe(0);
    });
  });

  describe("decrease direction", () => {
    it("calculates progress correctly when lower is better", () => {
      const config: KRMetricConfig = {
        ...baseConfig,
        direction: "decrease",
        start_value: 100,
        target_value: 50,
      };
      const result = calculateProgress(config, [value(75)]);
      expect(result.progressPercent).toBeCloseTo(0.5, 1);
      expect(result.status).toBe("on_track");
    });
  });

  describe("maintain direction", () => {
    it("full progress when exactly at target", () => {
      const config: KRMetricConfig = {
        ...baseConfig,
        direction: "maintain",
        start_value: 99,
        target_value: 99.9,
      };
      const result = calculateProgress(config, [value(99.9)]);
      expect(result.progressPercent).toBeCloseTo(1, 5);
    });
  });

  describe("divide-by-zero guards", () => {
    it("does not divide by zero when start equals target for increase direction", () => {
      const config: KRMetricConfig = {
        ...baseConfig,
        direction: "increase",
        start_value: 50,
        target_value: 50,
      };
      const result = calculateProgress(config, [value(50)]);
      expect(Number.isFinite(result.progressPercent)).toBe(true);
      expect(Number.isNaN(result.progressPercent)).toBe(false);
    });
  });
});
