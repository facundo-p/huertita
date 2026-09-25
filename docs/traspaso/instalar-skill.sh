#!/usr/bin/env bash
# Instala el skill "mapa de pendientes" como skill de usuario, disponible en todos tus proyectos.
# Correlo en la Mac, desde el repo: bash docs/traspaso/instalar-skill.sh
# Después se invoca con /mapa-de-pendientes o pidiendo "armame el mapa de pendientes".
set -euo pipefail
origen="$(cd "$(dirname "$0")" && pwd)/SKILL-mapa-de-pendientes.md"
destino="$HOME/.claude/skills/mapa-de-pendientes"
mkdir -p "$destino"
cp "$origen" "$destino/SKILL.md"
echo "Listo: $destino/SKILL.md"
echo "Abrí una sesión nueva de Claude Code y probá: /mapa-de-pendientes"
