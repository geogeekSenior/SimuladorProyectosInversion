#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
seleccion_proyectos_top20.py  – versión *sin duplicar nombres*

NUEVA REGLA: **No se puede escoger más de una versión del mismo
"Nombre del Proyecto"**.  Cada nombre suele tener hasta 3 variantes y se
puede elegir **0 o 1** de ellas.

Cambios clave:
• Los proyectos se agrupan por columna `Nombre del Proyecto` (alias
  `name_col`).
• La mochila ahora es **Multiple‑Choice Knapsack Problem (MCKP)**:
    – Para cada grupo (nombre) elijo 0 o 1 de sus variantes.
• El backtracking que genera las TOP N combinaciones recorre grupos, no
  filas individuales, garantizando la regla.

Criterios de orden y desempate permanecen:
1. maximizar Δ vida
2. a igualdad de Δ vida, gastar más presupuesto
3. luego, mayor vida_total

Requisitos: pandas ≥ 1.0
"""

import pandas as pd
import heapq
from typing import List, Tuple, Optional

# ------------------------------------------------------------------ #
# 1. COMBINACIÓN ÓPTIMA  (MCKP)                                      #
# ------------------------------------------------------------------ #

def mckp_max_delta(
    df: pd.DataFrame,
    group_col: str,
    life_col: str,
    cost_col: str,
    base_life: float,
    budget: float,
    id_col: Optional[str] = None,
    scale: int = 100,
) -> Tuple[pd.DataFrame, float, float]:
    """Multiple‑choice knapsack:  0‑1 por grupo."""

    df = df.copy()
    df["delta_vida"] = df[life_col] - base_life

    # — Agrupar por nombre de proyecto —
    groups = [g.index.tolist() for _, g in df.groupby(group_col, sort=False)]

    # Escalar costes a enteros
    cost_int = (df[cost_col] * scale).round().astype(int).tolist()
    budget_int = int(round(budget * scale))
    delta_vals = df["delta_vida"].tolist()

    # DP: para cada coste almacenamos (delta, cost_neg) y la lista de selecciones
    dp = [(-float("inf"), 0, [])] * (budget_int + 1)
    dp[0] = (0.0, 0, [])

    for grp in groups:
        new_dp = dp.copy()
        for idx in grp:
            c = cost_int[idx]
            d = delta_vals[idx]
            for b in range(budget_int, c - 1, -1):
                prev_delta, prev_cost_neg, prev_sel = dp[b - c]
                cand_delta = prev_delta + d
                cand_cost_neg = prev_cost_neg - c  # más negativo ⇒ más costo
                best_delta, best_cost_neg, _ = new_dp[b]
                if (cand_delta > best_delta) or (
                    cand_delta == best_delta and cand_cost_neg < best_cost_neg):
                    new_dp[b] = (
                        cand_delta,
                        cand_cost_neg,
                        prev_sel + [idx],
                    )
        dp = new_dp  # avanzar al siguiente grupo

    # Mejor estado = mayor Δ, luego más gasto
    best_b = max(
        range(budget_int + 1),
        key=lambda b: (dp[b][0], -dp[b][1])
    )
    best_delta, _, best_sel = dp[best_b]

    opt_df = df.loc[best_sel].copy()
    if id_col and id_col not in opt_df.columns:
        opt_df.insert(0, id_col, df.loc[best_sel, id_col].values)

    opt_df.sort_values("delta_vida", ascending=False, inplace=True)
    total_cost = opt_df[cost_col].sum()
    return opt_df.reset_index(drop=True), best_delta, total_cost

# ------------------------------------------------------------------ #
# 2. TOP‑N COMBINACIONES (Únicas por nombre)                          #
# ------------------------------------------------------------------ #

def top_n_combinations(
    df: pd.DataFrame,
    group_col: str,
    life_col: str,
    cost_col: str,
    base_life: float,
    budget: float,
    id_col: Optional[str] = None,
    scale: int = 100,
    top_n: int = 20,
) -> pd.DataFrame:
    df = df.copy()
    df["delta_vida"] = df[life_col] - base_life

    groups = [g.index.tolist() for _, g in df.groupby(group_col, sort=False)]
    cost_int = (df[cost_col] * scale).round().astype(int).tolist()
    delta_vals = df["delta_vida"].tolist()
    vida_vals = df[life_col].tolist()
    budget_int = int(round(budget * scale))

    heap: List[Tuple[float, int, float, Tuple[int, ...]]] = []

    def consider(sel: List[int], d_sum: float, c_sum_int: int, v_sum: float):
        item = (d_sum, -c_sum_int, -v_sum, tuple(sorted(sel)))
        if len(heap) < top_n:
            heapq.heappush(heap, item)
        else:
            if item > heap[0]:
                heapq.heapreplace(heap, item)

    # Backtracking por grupos (0‑1 elección)
    def backtrack(g: int, d_sum: float, c_sum_int: int, v_sum: float, sel: List[int]):
        if c_sum_int > budget_int:
            return
        if g == len(groups):
            if sel:
                consider(sel, d_sum, c_sum_int, v_sum)
            return
        # Opción 1: saltar grupo
        backtrack(g + 1, d_sum, c_sum_int, v_sum, sel)
        # Opción 2: escoger una de sus variantes
        for idx in groups[g]:
            backtrack(
                g + 1,
                d_sum + delta_vals[idx],
                c_sum_int + cost_int[idx],
                v_sum + vida_vals[idx],
                sel + [idx],
            )

    backtrack(0, 0.0, 0, 0.0, [])

    combos = sorted(heap, reverse=True)
    rows = []
    for d_tot, neg_c_int, neg_v, idx_tuple in combos:
        cost_total = -neg_c_int / scale
        vida_total = -neg_v
        ids = df.loc[list(idx_tuple), id_col].tolist() if id_col else list(idx_tuple)
        rows.append({
            "delta_total": d_tot,
            "costo_total": cost_total,
            "vida_total": vida_total,
            "ratio": d_tot / cost_total if cost_total else 0,
            "IDs": ids,
        })
    return pd.DataFrame(rows)

# ------------------------------------------------------------------ #
# 3. DETALLE DE COMBINACIÓN                                           #
# ------------------------------------------------------------------ #

def detalle(df: pd.DataFrame, ids: List, life_col: str, base: float, cost_col: str, id_col: str):
    sub = df[df[id_col].isin(ids)].copy()
    sub["delta_vida"] = sub[life_col] - base
    return sub[[id_col, "Nombre del Proyecto", life_col, "delta_vida",
                "Seguridad", "Desarrollo", "Gobernabilidad", cost_col]]\
             .sort_values("delta_vida", ascending=False).reset_index(drop=True)

# ------------------------------------------------------------------ #
# 4. MAIN                                                             #
# ------------------------------------------------------------------ #

if __name__ == "__main__":
    ruta_csv    = r"c:/Users/Sebastian/Downloads/EquiposIndicadoresIteracion.csv"
    life_col    = "vida"
    cost_col    = "Valor InversiÃ³n (mill)"  # corrige encoding si se ve mal
    name_col    = "Nombre del Proyecto"     # columna para agrupar
    base_life   = 75.88
    presupuesto = 10_000
    id_col      = "objectid"
    top_n       = 20

    proyectos = pd.read_csv(ruta_csv, delimiter=";")

    # COMBINACIÓN ÓPTIMA (sin duplicar nombres)
    opt_df, delta_opt, costo_opt = mckp_max_delta(
        proyectos, name_col, life_col, cost_col,
        base_life, presupuesto, id_col)

    print("\n=== COMBINACIÓN ÓPTIMA ===")
    print(opt_df[[id_col, name_col, life_col, "delta_vida",
                  "Seguridad", "Desarrollo", "Gobernabilidad", cost_col]]\
            .to_string(index=False))
    print(f"\nSuma de Δ vida : {delta_opt:.2f}")
    print(f"Costo total     : {costo_opt:.0f} (de {presupuesto})")

    # TOP‑N
    top_df = top_n_combinations(
        proyectos, name_col, life_col, cost_col,
        base_life, presupuesto, id_col=id_col, top_n=top_n)

    print(f"\n=== TOP {top_n} COMBINACIONES ===")
    print(top_df[["delta_total", "costo_total", "vida_total", "ratio", "IDs"]]\
            .to_string(index=False))

    # detalle
    for i, row in top_df.iterrows():
        print(f"\n--- COMBINACIÓN {i+1} | Δ={row['delta_total']:.2f} | Costo={row['costo_total']:.0f}")
        print(detalle(proyectos, row["IDs"], life_col, base_life, cost_col, id_col)\
                .to_string(index=False))


