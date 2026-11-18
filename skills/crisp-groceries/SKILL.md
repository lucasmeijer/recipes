---
name: crisp-groceries
description: Manage Crisp grocery orders and custom recipes through the Crisp app, and read product nutrition labels. Use when the user asks to shop, modify an order or recipe, or check nutrition in Crisp.
---

# Crisp groceries

Crisp is a online grocery delivery service that operates in the Netherlands and Belgium. 

## Access and navigation

At the time of this writing, the only Agent compatible way to interface with Crisp grocery service is to run the agent on a mac,
and have it use its computer-use capabilities, to control the Crisp iPhone app, which can actually run on a mac.  It's available on the mac app store under bundle name `Crisp`.  It only supports email-link authentication. 

On macOS, open `/Applications/Crisp.app` from Finder if Crisp isn’t already running, then attach your computer-use tool to the live Crisp process using its current full path, which macOS may expose under a temporary `…/Wrapper/Crisp.app` mount.

## UI pitfalls

- Native accessibility trees can include adjacent, off-screen recipe pages. Confirm the visible recipe title before editing or adding; don't choose the first matching button in the tree.
- Quantity pills reveal transient minus/trash and plus controls. They can collapse before the next interaction. Reveal the control, inspect fresh state, and act promptly. Repeated clicks on the pill alone don't change quantity.
- Accessibility IDs can become invalid after save, navigation, or refresh. Re-observe instead of retrying an old ID. When the tree is misleading, use a screenshot and coordinates derived from that screenshot; window size and scale vary.
- Saving an edit can return to a different position in the recipe carousel. Navigate back to the intended recipe and verify the saved result before adding it.
- Long recipe descriptions may be truncated in the accessibility summary. Focusing the editable description field can expose its full value. Read that value before replacing it, preserve unrelated content, and verify the saved text. Use the supported field-value operation when multiline typing is unreliable.

## Custom recipes

A custom recipe has both a free-text description and linked product quantities. Keep both consistent. Removing an ingredient from the prose does **not** remove its linked packs from the shopping list.

When changing ingredients:

- Edit the linked product quantities and the ingredients/preparation text.
- Recalculate affected nutrition totals and per-portion values.
- Update any linked preparation chart if it is part of the maintained recipe.
- Save, then verify the description and shopping ingredients. Avoid confusing a row's removal control with the whole-recipe trash button.

## Nutrition from Crisp labels

Read the exact product's nutrition panel, not a generic food estimate, when available. Record pack size, label basis, kcal, protein, carbohydrate, and fat for the metrics requested. Similar products, can differ substantially. Do not treat an omitted value as zero.
