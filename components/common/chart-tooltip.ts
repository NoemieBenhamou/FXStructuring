import { createElement, type CSSProperties, type ReactNode } from "react";

type TooltipPayloadItem = {
  color?: string;
  fill?: string;
  hide?: boolean;
  name?: ReactNode;
  stroke?: string;
  value?: ReactNode;
};

type FormatterResult = ReactNode | [ReactNode, ReactNode];

type DarkChartTooltipContentProps = {
  active?: boolean;
  formatter?: (
    value: TooltipPayloadItem["value"],
    name: TooltipPayloadItem["name"],
    item: TooltipPayloadItem,
    index: number,
    payload: readonly TooltipPayloadItem[]
  ) => FormatterResult;
  label?: ReactNode;
  labelFormatter?: (label: ReactNode, payload: readonly TooltipPayloadItem[]) => ReactNode;
  payload?: readonly TooltipPayloadItem[];
};

const tooltipWrapperStyle: CSSProperties = {
  outline: "none"
};

function DarkChartTooltipContent({ active, formatter, label, labelFormatter, payload }: DarkChartTooltipContentProps) {
  const visiblePayload = payload?.filter((item) => item.value !== null && item.value !== undefined && !item.hide) ?? [];

  if (!active || visiblePayload.length === 0) return null;

  const displayLabel = labelFormatter ? labelFormatter(label, visiblePayload) : label;

  return createElement(
    "div",
    {
      className:
        "min-w-[210px] rounded-xl border border-bank-border bg-bank-panel/95 px-3.5 py-3 text-sm text-bank-text shadow-2xl shadow-black/30 backdrop-blur"
    },
    displayLabel
      ? createElement("div", { className: "mb-2 font-semibold text-bank-muted" }, displayLabel)
      : null,
    createElement(
      "div",
      { className: "space-y-1.5" },
      visiblePayload.map((item, index) => {
        const formatted = formatter ? formatter(item.value, item.name, item, index, visiblePayload) : item.value;
        const [value, name] = Array.isArray(formatted) ? formatted : [formatted, item.name];
        const color = item.color ?? item.stroke ?? item.fill ?? "#F8FAFC";

        return createElement(
          "div",
          {
            className: "flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5",
            key: `${String(name)}-${index}`,
            style: { color }
          },
          name ? createElement("span", { className: "font-medium" }, name) : null,
          name ? createElement("span", null, ":") : null,
          createElement("span", { className: "font-mono" }, value)
        );
      })
    )
  );
}

export const darkChartTooltipProps = {
  content: createElement(DarkChartTooltipContent),
  wrapperStyle: tooltipWrapperStyle
};

export const darkCartesianTooltipProps = {
  ...darkChartTooltipProps,
  cursor: {
    stroke: "#CBD5E1",
    strokeOpacity: 0.72,
    strokeWidth: 1
  }
};
