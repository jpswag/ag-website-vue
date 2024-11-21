set -ex

npx eslint \
    'src/**/*.cy.ts' \
    'tests/e2e/**/*.ts'

npx prettier --check \
    './*.js' \
    './*.ts' \
    'tests/e2e/**/*.ts'

./check_subscribe_unsubscribe.py 'src/**/*.vue'
