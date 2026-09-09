export type MenuItemType = "SIDE" | "DRINK" | "PIZZA";

export type PizzaSize = "SMALL" | "MEDIUM" | "LARGE";

export interface MenuItem {
  id: string;
  name: string;
  type: MenuItemType;
  price?: number;
  sizePricing?: Record<PizzaSize, number>;
}
