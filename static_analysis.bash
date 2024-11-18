set -ex

npx prettier --check \
    './*.js' \
    './*.ts'

./check_subscribe_unsubscribe.py 'src/**/*.vue'
