#!/bin/bash
set -e

# Reset NX cache to avoid integrity issues
npx nx reset

# Run the application
exec "$@"
