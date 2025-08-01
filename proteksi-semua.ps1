#!/bin/bash

# Folder kerja (ubah jika perlu)
folder="./"

# Tambahkan proteksi ke semua file HTML yang sesuai
for file in "$folder"/*.html; do
  if grep -q "<script type=\"module\">" "$file"; then
    echo "✅ Sudah ada <script type=module> di $file, dilewati..."
  else
    echo "➕ Menambahkan proteksi ke: $file"
    sed -i '1i\<script type="module"> import { cekAksesFitur } from "./proteksi-fitur.js"; document.addEventListener("DOMContentLoaded", () => { cekAksesFitur("'$(basename "$file")'"); }); </script>' "$file"
  fi
done
