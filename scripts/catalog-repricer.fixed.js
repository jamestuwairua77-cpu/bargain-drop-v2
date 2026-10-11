python
import math


def calculate_optimized_price(base_cost: float, multiplier: float) -&gt; float:
    raw_price = base_cost * multiplier
    # Floor to nearest whole dollar and add .95
    optimized_price = math.floor(raw_price) + 0.95

    # Adjustment if rounded down too far below raw calculated price
    if optimized_price &lt; raw_price - 0.5:
        optimized_price += 1.0

    return round(optimized_price, 2)


# Example Test
sample_items = [
    {"sku": "SKU-001", "tier": 1, "multiplier": 3.2, "cost": 12.50, "shopify_price": 35.00},
    {"sku": "SKU-002", "tier": 2, "multiplier": 2.2, "cost": 45.00, "shopify_price": 99.00},
    {"sku": "SKU-003", "tier": 3, "multiplier": 1.7, "cost": 110.00, "shopify_price": 187.00},
]

print(f"{'SKU':&lt;10} | {'Cost':&lt;8} | {'Tier':&lt;5} | {'Current':&lt;8} | {'Optimized':&lt;10} | {'Status'}")
print("-" * 60)

for item in sample_items:
    target = calculate_optimized_price(item["cost"], item["multiplier"])
    discrepancy = target != item["shopify_price"]
    status = "ACTION REQUIRED" if discrepancy else "OK"
    print(
        f"{item['sku']:&lt;10} | ${item['cost']:&lt;7.2f} | {item['tier']:&lt;5} | ${item['shopify_price']:&lt;7.2f} | ${target:&lt;9.2f} | {status}"
    )