set -ex

npx eslint \
    'tests/e2e/**/*.ts'

npx prettier --check \
    './*.js' \
    './*.ts' \
    'tests/e2e/**/*.ts'

./check_subscribe_unsubscribe.py 'src/**/*.vue'
