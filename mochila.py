#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
seleccion_proyectos_top20.py  –  versión *sin duplicar nombres*

NUEVA REGLA: **No se puede escoger más de una versión del mismo
"Nombre del Proyecto"**.  Cada nombre suele tener hasta 3 variantes y se
puede elegir **0 o 1** de ellas.

Cambios clave:
• Los proyectos se agrupan por columna `Nombre del Proyecto` (alias
  `name_col`).
• La mochila ahora es **Multiple‑Choice Knapsack Problem (MCKP)**:
    – Para cada grupo (nombre) elijo 0 o 1 de sus variantes.
• El backtracking que genera las TOP N combinaciones recorre grupos, no
  filas individuales, garantizando la regla.

Criterios de orden y desempate permanecen:
1. maximizar Δ vida
2. a igualdad de Δ vida, gastar más presupuesto
3. luego, mayor vida_total

Requisitos: pandas ≥ 1.0, openpyxl (for Excel export)
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
    # Store original indices for each group
    groups_with_indices = {name: g.index.tolist() for name, g in df.groupby(group_col, sort=False)}
    group_names = list(groups_with_indices.keys()) # Keep order of groups as they appear in df
    groups = [groups_with_indices[name] for name in group_names]


    # Escalar costes a enteros
    cost_int = (df[cost_col] * scale).round().astype(int).tolist()
    budget_int = int(round(budget * scale))
    delta_vals = df["delta_vida"].tolist()

    # DP: para cada coste almacenamos (delta, cost_neg) y la lista de selecciones (indices originales)
    # dp[b] = (current_max_delta, negative_cost_for_tie_breaking, list_of_selected_original_indices)
    dp = [(-float("inf"), 0, []) for _ in range(budget_int + 1)]
    dp[0] = (0.0, 0, [])

    # dp_group_choices[b] stores the specific item chosen from each group for the solution at budget b
    # This helps reconstruct which item from which group was chosen.
    # dp_group_choices[b] = {group_index: chosen_item_original_index}
    # This was commented out as it wasn't fully utilized in the reconstruction logic below,
    # but could be useful for more detailed path tracking if needed.
    # dp_group_choices = [{} for _ in range(budget_int + 1)]


    for group_idx, grp_item_indices in enumerate(groups): # Iterate through groups of items
        new_dp = dp[:] # Start with current DP table for this group
        # new_dp_group_choices = dp_group_choices[:] # if dp_group_choices were used

        for item_original_idx in grp_item_indices: # Iterate through items within the current group
            # Ensure item_original_idx is within bounds for cost_int and delta_vals
            if item_original_idx >= len(cost_int) or item_original_idx >= len(delta_vals):
                print(f"Warning (mckp_max_delta): item_original_idx {item_original_idx} is out of bounds. Skipping.")
                continue

            c = cost_int[item_original_idx]
            d = delta_vals[item_original_idx]

            for b in range(budget_int, c - 1, -1): # Iterate budget downwards
                prev_delta, prev_cost_neg, prev_sel_indices = dp[b - c]
                
                cand_delta = prev_delta + d
                cand_cost_neg = prev_cost_neg - c  # more negative ⇒ más costo

                current_best_delta_at_b, current_best_cost_neg_at_b, _ = new_dp[b]

                if (cand_delta > current_best_delta_at_b) or \
                   (cand_delta == current_best_delta_at_b and cand_cost_neg < current_best_cost_neg_at_b):
                    new_selection = prev_sel_indices + [item_original_idx]
                    new_dp[b] = (cand_delta, cand_cost_neg, new_selection)
        dp = new_dp


    # Find the best solution across all possible budget points
    best_b_idx = 0
    max_delta_overall = -float("inf")
    min_neg_cost_overall = 0 

    for b_idx in range(budget_int + 1):
        current_delta, current_neg_cost, _ = dp[b_idx]
        if current_delta > max_delta_overall:
            max_delta_overall = current_delta
            min_neg_cost_overall = current_neg_cost
            best_b_idx = b_idx
        elif current_delta == max_delta_overall:
            if current_neg_cost < min_neg_cost_overall: 
                min_neg_cost_overall = current_neg_cost
                best_b_idx = b_idx

    best_delta_val, _, best_sel_indices = dp[best_b_idx]
    
    opt_df = df.loc[list(set(best_sel_indices))].copy() # Use set to ensure unique indices before .loc

    # Add id_col if specified and not already present
    if id_col:
        if id_col not in opt_df.columns and id_col in df.columns:
            opt_df[id_col] = df.loc[opt_df.index, id_col].values # Assign directly using .loc for alignment
        elif id_col not in opt_df.columns and df.index.name == id_col:
             opt_df[id_col] = opt_df.index # If id_col is the index
        # If id_col is already in opt_df.columns, no action needed.

    opt_df.sort_values("delta_vida", ascending=False, inplace=True)
    total_cost = opt_df[cost_col].sum()
    return opt_df.reset_index(drop=True), best_delta_val, total_cost


# ------------------------------------------------------------------ #
# 2. TOP‑N COMBINACIONES (Únicas por nombre)                         #
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
    top_n: int = 100,
) -> pd.DataFrame:
    df = df.copy()
    df["delta_vida"] = df[life_col] - base_life

    groups_with_indices = {name: g.index.tolist() for name, g in df.groupby(group_col, sort=False)}
    group_names_ordered = list(groups_with_indices.keys())
    groups = [groups_with_indices[name] for name in group_names_ordered]

    cost_int = (df[cost_col] * scale).round().astype(int).tolist()
    delta_vals = df["delta_vida"].tolist()
    vida_vals = df[life_col].tolist() 
    budget_int = int(round(budget * scale))

    heap: List[Tuple[float, float, float, Tuple[int, ...]]] = []

    def consider(sel: List[int], d_sum: float, c_sum_int: int, v_sum: float):
        nonlocal heap # ****** ADDED nonlocal DECLARATION HERE ******
        item = (d_sum, -c_sum_int, -v_sum, tuple(sorted(sel))) 
        
        if len(heap) < top_n:
            # Add if heap is not full, ensuring the combination (by indices) is not already there
            # This check might be redundant if tuple(sorted(sel)) is unique for unique combinations
            # and heapq handles duplicates based on the full tuple.
            # For safety, explicitly check if the set of indices is already in one of the heap's tuples.
            if not any(h_item[3] == item[3] for h_item in heap):
                 heapq.heappush(heap, item)
        else:
            if item > heap[0]: 
                # If item is better than the worst in the heap, try to replace/add.
                # Check if this exact set of indices is already in the heap.
                # If it is, but with a worse score (which shouldn't happen if item > heap[0] and item is unique),
                # or if it's not present.
                
                # Remove any existing version of this specific selection (item[3])
                # This handles cases where a path might lead to the same item set
                # but was pushed earlier with a score that would now be evicted.
                temp_heap = [h for h in heap if h[3] != item[3]]
                heapq.heapify(temp_heap) # Not strictly necessary if just rebuilding, but good practice
                heap = temp_heap # This assignment makes 'heap' local if not for 'nonlocal'

                if len(heap) < top_n: # If space opened up or it was already smaller
                    heapq.heappush(heap, item)
                elif item > heap[0]: # Re-check, should still be true if logic is sound
                    heapq.heapreplace(heap, item) # Replace the smallest (worst)
                # If after removing, heap is full and item is not better than new heap[0], it's not added.


    def backtrack(g_idx: int, current_d_sum: float, current_c_sum_int: int, current_v_sum: float, current_sel_indices: List[int]):
        if current_c_sum_int > budget_int:
            return

        if g_idx == len(groups):
            if current_sel_indices: 
                consider(current_sel_indices, current_d_sum, current_c_sum_int, current_v_sum)
            return

        # Option 1: Skip current group
        backtrack(g_idx + 1, current_d_sum, current_c_sum_int, current_v_sum, current_sel_indices)

        # Option 2: Select one project from the current group
        for item_original_idx in groups[g_idx]:
            if item_original_idx >= len(cost_int) or item_original_idx >= len(delta_vals) or item_original_idx >= len(vida_vals):
                print(f"Warning (backtrack): item_original_idx {item_original_idx} is out of bounds. Skipping.")
                continue
            backtrack(
                g_idx + 1,
                current_d_sum + delta_vals[item_original_idx],
                current_c_sum_int + cost_int[item_original_idx],
                current_v_sum + vida_vals[item_original_idx], 
                current_sel_indices + [item_original_idx],
            )

    backtrack(0, 0.0, 0, 0.0, [])
    combos = sorted(heap, reverse=True)

    rows = []
    # Using a set for processed_sels_indices ensures that we only add unique *sets of projects*
    # to the final list, even if they were generated multiple times by backtrack (which shouldn't happen with MCKP).
    processed_sels_indices = set() 
    
    for d_tot, neg_c_int, neg_v_sum, idx_tuple in combos:
        if idx_tuple in processed_sels_indices: # Check if this exact tuple of indices was already processed
            continue 
        processed_sels_indices.add(idx_tuple)

        cost_total = -neg_c_int / scale
        vida_total = -neg_v_sum 

        # Get actual IDs for the selected projects
        ids_list = []
        if id_col:
            # Ensure indices in idx_tuple are valid for df.loc
            valid_indices = [idx for idx in idx_tuple if idx in df.index]
            if not valid_indices: # Should not happen if indices come from df
                print(f"Warning: No valid indices in idx_tuple: {idx_tuple} for combination.")
                continue

            selected_items_df = df.loc[list(valid_indices)] # Use list of valid_indices
            
            if id_col in selected_items_df.columns:
                ids_list = selected_items_df[id_col].tolist()
            elif df.index.name == id_col: 
                 ids_list = selected_items_df.index.tolist()
            # Fallback if id_col is not directly in columns of selected_items_df (e.g. if it was only in original df)
            elif id_col in df.columns:
                ids_list = df.loc[list(valid_indices), id_col].tolist()
            else: # Fallback to original indices if id_col cannot be resolved
                ids_list = list(valid_indices)
        else:
            ids_list = list(idx_tuple) 

        rows.append({
            "delta_total": d_tot,
            "costo_total": cost_total,
            "vida_total": vida_total,
            "ratio": d_tot / cost_total if cost_total else 0,
            "IDs": ids_list, 
            "_indices": idx_tuple 
        })
        if len(rows) >= top_n: 
            break
            
    return pd.DataFrame(rows)


# ------------------------------------------------------------------ #
# 3. DETALLE DE COMBINACIÓN                                          #
# ------------------------------------------------------------------ #

def detalle(df_original: pd.DataFrame, ids_or_indices: List, life_col: str, base_life_val: float, cost_col: str, id_col_name: Optional[str], is_indices: bool = False):
    sub_df = df_original.copy() 

    selected_rows = pd.DataFrame() # Initialize an empty DataFrame

    if not ids_or_indices: # Handle empty list of ids/indices
        print(f"Warning (detalle): Received empty list for ids_or_indices.")
        return selected_rows

    if is_indices:
        # Filter out any indices not present in the DataFrame to prevent .loc errors
        valid_indices = [idx for idx in ids_or_indices if idx in sub_df.index]
        if valid_indices:
            selected_rows = sub_df.loc[valid_indices].copy()
        else:
            print(f"Warning (detalle): No valid indices found in df_original for {ids_or_indices}")
    elif id_col_name and id_col_name in sub_df.columns:
        selected_rows = sub_df[sub_df[id_col_name].isin(ids_or_indices)].copy()
    elif id_col_name and sub_df.index.name == id_col_name:
        selected_rows = sub_df[sub_df.index.isin(ids_or_indices)].copy()
    else:
        print(f"Warning (detalle): Cannot identify projects. id_col_name: {id_col_name}, is_indices: {is_indices}. IDs/Indices provided: {ids_or_indices}")
        return selected_rows # Return empty DataFrame

    if selected_rows.empty:
        print(f"Warning (detalle): No rows selected for IDs/Indices: {ids_or_indices}")
        return selected_rows

    selected_rows["delta_vida"] = selected_rows[life_col] - base_life_val
    
    display_cols = []
    # Add id_col_name first if it's valid and exists
    if id_col_name:
        if id_col_name in selected_rows.columns:
            display_cols.append(id_col_name)
        elif selected_rows.index.name == id_col_name and id_col_name not in display_cols : # if id_col is index
            # If id_col is the index, it won't be in columns unless reset.
            # For display, we might need to reset_index or handle it.
            # For now, assume if it's index, it will be handled by to_string or to_excel.
            # Or, ensure it's a column:
            # temp_selected_rows = selected_rows.reset_index()
            # if id_col_name in temp_selected_rows.columns:
            # display_cols.append(id_col_name)
            pass # Handled by pandas if index is named and shown

    
    standard_cols = ["Nombre del Proyecto", life_col, "delta_vida", "Seguridad", "Desarrollo", "Gobernabilidad", cost_col]
    for col in standard_cols:
        if col in selected_rows.columns and col not in display_cols: # Add if exists and not already added
            display_cols.append(col)
    
    # Ensure all display_cols actually exist in selected_rows to prevent KeyErrors
    final_display_cols = [col for col in display_cols if col in selected_rows.columns or selected_rows.index.name == col]
    # If id_col_name was the index, and we want it as a column in the output:
    if id_col_name and selected_rows.index.name == id_col_name and id_col_name not in final_display_cols:
        selected_rows_processed = selected_rows.reset_index()
        if id_col_name in selected_rows_processed.columns:
             final_display_cols.insert(0, id_col_name) # Add to beginning
        return selected_rows_processed[final_display_cols].sort_values("delta_vida", ascending=False).reset_index(drop=True)


    return selected_rows[final_display_cols].sort_values("delta_vida", ascending=False).reset_index(drop=True)


# ------------------------------------------------------------------ #
# 4. MAIN                                                            #
# ------------------------------------------------------------------ #

if __name__ == "__main__":
    # --- Configuration ---
    ruta_csv    = r"Libro1.csv"
    try:
        proyectos_df = pd.read_csv(ruta_csv, delimiter=";")
    except FileNotFoundError:
        print(f"Error: El archivo CSV no se encontró en la ruta: {ruta_csv}")
        exit(1) # Exit with an error code
    except Exception as e:
        print(f"Error al leer el archivo CSV: {e}")
        print("Intentando con encoding 'latin1'...")
        try:
            proyectos_df = pd.read_csv(ruta_csv, delimiter=";", encoding='latin1')
        except Exception as e_latin1:
            print(f"Error al leer con 'latin1': {e_latin1}")
            print("Asegúrese de que la ruta del archivo CSV es correcta y el archivo no está corrupto.")
            exit(1)

    life_col    = "vida"
    cost_col    = "valorinversion" 
    name_col    = "proyecto"     
    id_col      = "id_proyecto"                

    base_life   = 72.044
    presupuesto = 10_000    
    top_n_count = 20        
    scale_factor= 20       

    output_excel_path = "project_selection_results.xlsx"

    # --- Data Sanity Checks and Preparation ---
    # Check for id_col first as it's crucial for indexing/joining later
    if id_col not in proyectos_df.columns and proyectos_df.index.name != id_col:
        print(f"Error: La columna ID especificada '{id_col}' no existe en el CSV ni como índice.")
        # Try to set index if 'objectid' (common default) exists and id_col is 'objectid'
        if id_col == "objectid" and "objectid" in proyectos_df.columns:
            print(f"Intentando usar la columna 'objectid' como índice.")
            # proyectos_df.set_index("objectid", inplace=True) # This changes df structure, be careful
            # For this script, it's better to ensure id_col is a regular column or handled if it's index.
            # The functions are designed to handle id_col as a column name primarily.
        else:
            print("Por favor, verifique el nombre de la columna ID.")
            exit(1)
    
    # Ensure original DataFrame index is unique if it's going to be used by .loc implicitly
    # or if id_col is not set. For this script, we mostly use .loc with lists of original indices
    # derived from df.index.tolist() within groups, so original index should be fine.
    # If not using a specific id_col and relying on original index, ensure it's clean.
    # For this script, we assume df.index are unique default integer indices if no id_col is used for joining.

    # Check other required columns
    required_cols_data = [life_col, cost_col, name_col] # id_col checked above
    missing_cols = [col for col in required_cols_data if col not in proyectos_df.columns]
    if missing_cols:
        print(f"Error: Faltan las siguientes columnas de datos requeridas en el CSV: {', '.join(missing_cols)}")
        # Attempt to correct common encoding issue for cost_col
        if cost_col not in proyectos_df.columns:
            corrected_cost_col_name = None
            if "Valor InversiÃ³n (mill)" in proyectos_df.columns:
                corrected_cost_col_name = "Valor InversiÃ³n (mill)"
            elif "Valor Inversion (mill)" in proyectos_df.columns:
                corrected_cost_col_name = "Valor Inversion (mill)"
            
            if corrected_cost_col_name:
                print(f"Se encontró '{corrected_cost_col_name}', se renombrará a '{cost_col}'.")
                proyectos_df.rename(columns={corrected_cost_col_name: cost_col}, inplace=True)
            else:
                print(f"La columna de costo '{cost_col}' no se encontró con variaciones comunes.")
        
        # Re-check after potential rename
        missing_cols = [col for col in required_cols_data if col not in proyectos_df.columns]
        if missing_cols:
            print(f"Columnas aún faltantes: {', '.join(missing_cols)}. Por favor, verifique los nombres.")
            exit(1)
    
    # Convert relevant columns to numeric, coercing errors
    for col_to_convert in [life_col, cost_col]:
        if col_to_convert in proyectos_df.columns:
            proyectos_df[col_to_convert] = proyectos_df[col_to_convert].astype(str).str.replace(",", ".")
            proyectos_df[col_to_convert] = pd.to_numeric(proyectos_df[col_to_convert], errors='coerce')
            if proyectos_df[col_to_convert].isnull().any():
                print(f"Advertencia: La columna '{col_to_convert}' contenía valores no numéricos. Se convirtieron a NaN y se rellenaron con 0.")
                proyectos_df[col_to_convert].fillna(0, inplace=True)
        else: # Should have been caught by missing_cols check
            print(f"Error crítico: La columna '{col_to_convert}' no existe para la conversión numérica.")
            exit(1)
    
    # Ensure 'delta_vida' is calculated on a clean 'life_col'
    # This is done inside functions, but pre-check here is also good.

    print("--- Procesando Combinación Óptima (MCKP) ---")
    opt_df, delta_opt, costo_opt = mckp_max_delta(
        proyectos_df,
        group_col=name_col,
        life_col=life_col,
        cost_col=cost_col,
        base_life=base_life,
        budget=presupuesto,
        id_col=id_col, 
        scale=scale_factor
    )

    print("\n=== COMBINACIÓN ÓPTIMA (Regla: No duplicar Nombre del Proyecto) ===")
    display_cols_opt = []
    if id_col and (id_col in opt_df.columns or opt_df.index.name == id_col): display_cols_opt.append(id_col)
    
    standard_display_cols = [name_col, life_col, "delta_vida"]
    other_info_cols = ["Seguridad", "Desarrollo", "Gobernabilidad"] 
    
    for col in standard_display_cols:
        if col in opt_df.columns and col not in display_cols_opt: display_cols_opt.append(col)
    for col in other_info_cols:
        if col in opt_df.columns and col not in display_cols_opt: display_cols_opt.append(col)
    if cost_col in opt_df.columns and cost_col not in display_cols_opt: display_cols_opt.append(cost_col)
    
    opt_df_displayable = opt_df.copy()
    if id_col and opt_df.index.name == id_col : # If id_col is index, reset for display if needed
        opt_df_displayable.reset_index(inplace=True)

    print(opt_df_displayable[[col for col in display_cols_opt if col in opt_df_displayable.columns]].to_string(index=False))
    print(f"\nSuma de Δ vida : {delta_opt:.2f}")
    print(f"Costo total    : {costo_opt:.2f} (de {presupuesto})")

    print(f"\n--- Procesando Top {top_n_count} Combinaciones (MCKP) ---")
    top_df = top_n_combinations(
        proyectos_df,
        group_col=name_col,
        life_col=life_col,
        cost_col=cost_col,
        base_life=base_life,
        budget=presupuesto,
        id_col=id_col, # Pass id_col here
        scale=scale_factor,
        top_n=top_n_count
    )

    print(f"\n=== TOP {top_n_count} COMBINACIONES (Regla: No duplicar Nombre del Proyecto) ===")
    top_df_summary_cols = ["delta_total", "costo_total", "vida_total", "ratio", "IDs"]
    top_df_to_print = top_df[[col for col in top_df_summary_cols if col in top_df.columns]].copy()
    if 'IDs' in top_df_to_print.columns:
        top_df_to_print['IDs_str'] = top_df_to_print['IDs'].apply(lambda x: ', '.join(map(str, x)) if isinstance(x, (list, tuple)) else str(x))
        # Print with IDs_str and then drop it if not needed for excel
        cols_to_print_summary = [c for c in ["delta_total", "costo_total", "vida_total", "ratio", "IDs_str"] if c in top_df_to_print.columns]
        print(top_df_to_print[cols_to_print_summary].to_string(index=False))
    else:
        print(top_df_to_print.to_string(index=False))


    # --- Export Results to Excel ---
    print(f"\n--- Exportando resultados a Excel: {output_excel_path} ---")
    try:
        with pd.ExcelWriter(output_excel_path, engine='openpyxl') as writer:
            # Sheet 1: Optimal Combination Details
            if not opt_df.empty:
                opt_df_excel = opt_df_displayable[[col for col in display_cols_opt if col in opt_df_displayable.columns]].copy()
                opt_df_excel.to_excel(writer, sheet_name="Optimal_Combination_Details", index=False)
            
            # Sheet 2: Top N Combinations Summary
            if not top_df.empty:
                top_df_excel_summary = top_df[[col for col in top_df_summary_cols if col in top_df.columns]].copy()
                if 'IDs' in top_df_excel_summary.columns:
                     top_df_excel_summary['IDs'] = top_df_excel_summary['IDs'].apply(lambda x: ', '.join(map(str, x)) if isinstance(x, (list,tuple)) else str(x))
                top_df_excel_summary.to_excel(writer, sheet_name=f"Top_{top_n_count}_Summary", index=False)

            # Sheets 3 to N+2: Details for each of the Top N combinations
            if not top_df.empty:
                print("\n--- Generando detalles para Top N Combinaciones para Excel ---")
                for i, row_data in top_df.iterrows(): # Use row_data to avoid conflict with outer 'row' if any
                    if i >= top_n_count : break 
                    
                    # 'IDs' from top_df should be the list of actual project identifiers (e.g., objectid values)
                    # '_indices' from top_df are the original DataFrame row indices.
                    ids_for_detail_lookup = row_data.get("IDs") 
                    
                    detail_df_for_excel = pd.DataFrame() # Initialize

                    if isinstance(ids_for_detail_lookup, (list, tuple)) and ids_for_detail_lookup:
                        # Use is_indices=False because ids_for_detail_lookup are actual IDs from id_col
                        detail_df_for_excel = detalle(proyectos_df, ids_for_detail_lookup, life_col, base_life, cost_col, id_col, is_indices=False)
                    else:
                        # Fallback or if IDs were not properly populated, try with _indices
                        indices_for_detail_lookup = row_data.get("_indices")
                        if isinstance(indices_for_detail_lookup, (list, tuple)) and indices_for_detail_lookup:
                            print(f"Advertencia para Combinación {i+1}: IDs no disponibles o no lista, usando _indices para detalle.")
                            detail_df_for_excel = detalle(proyectos_df, list(indices_for_detail_lookup), life_col, base_life, cost_col, id_col, is_indices=True)
                        else:
                            print(f"Error: No se pueden obtener detalles para la Combinación {i+1} (Excel), IDs e índices no válidos/faltantes en top_df.")
                            # Create a placeholder sheet
                            pd.DataFrame([{"message": f"No details found for Combination {i+1} due to missing ID/index data."}]).to_excel(writer, sheet_name=f"Combination_{i+1}_Details", index=False)
                            continue

                    sheet_name = f"Combination_{i+1}_Details"
                    if not detail_df_for_excel.empty:
                        # Ensure columns in detail_df_for_excel are suitable for Excel (e.g. id_col is present)
                        # The 'detalle' function should already prepare display_cols.
                        detail_df_for_excel.to_excel(writer, sheet_name=sheet_name, index=False)
                    else:
                        print(f"    Advertencia: El DataFrame de detalle para la Combinación {i+1} (Excel) está vacío.")
                        pd.DataFrame([{"message": f"Details for Combination {i+1} are empty."}]).to_excel(writer, sheet_name=sheet_name, index=False)
                    
                    # Console output for details (already done if you keep the previous loop)
                    # This part is just for Excel generation. The console print is separate.
                    if i < 5: # Only print first few details to console during Excel export part to avoid clutter
                        print(f"\n--- (Para Consola) COMBINACIÓN {i+1} | Δ={row_data['delta_total']:.2f} | Costo={row_data['costo_total']:.2f} | VidaTotal={row_data['vida_total']:.2f}")
                        if not detail_df_for_excel.empty:
                            print(detail_df_for_excel.to_string(index=False))
                        else:
                            print("    (Detalles no disponibles o vacíos para consola)")


        print(f"\nResultados exportados exitosamente a: {output_excel_path}")

    except ImportError:
        print("\nError: La librería 'openpyxl' es necesaria para exportar a Excel. Por favor, instálala con 'pip install openpyxl'.")
        exit(1)
    except Exception as e:
        print(f"\nOcurrió un error al procesar o exportar a Excel: {e}")
        import traceback
        traceback.print_exc() # Print full traceback for debugging
        exit(1)

