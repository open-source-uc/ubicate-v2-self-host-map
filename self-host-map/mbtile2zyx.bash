#!/bin/bash

MBTILES="./extracts/chile-merged.mbtiles"
OUTPUT_DIR="./ubicate-tiles"

mkdir -p "$OUTPUT_DIR"

sqlite3 "$MBTILES" "SELECT zoom_level, tile_column, tile_row FROM tiles;" | while IFS='|' read -r z x y; do
  # Convertir tile_row de TMS a XYZ
  y_xyz=$(( (1 << z) - 1 - y ))

  # Crear carpeta destino
  dir="$OUTPUT_DIR/$z/$x"
  mkdir -p "$dir"

  # Extraer tile_data como hex y convertir a bin
  sqlite3 -noheader -batch "$MBTILES" "SELECT hex(tile_data) FROM tiles WHERE zoom_level=$z AND tile_column=$x AND tile_row=$y;" | xxd -r -p > "$dir/$y_xyz.pbf"
done
