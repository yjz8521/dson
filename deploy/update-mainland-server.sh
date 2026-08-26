#!/usr/bin/env bash
set -Eeuo pipefail

SITE_DIR="/var/www/deshengtest"
DOMAIN="deshengtest.com"
WWW_DOMAIN="www.deshengtest.com"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
TMP_DIR="$(mktemp -d)"
NGINX_DUMP="${TMP_DIR}/nginx.txt"
NEW_CONFIG="${TMP_DIR}/deshengtest.conf"
BACKUP_CONFIG=""
ACTIVE_CONFIG=""
CONFIG_REPLACED=0

cleanup() {
  local status=$?

  if [[ "${status}" -ne 0 && "${CONFIG_REPLACED}" -eq 1 ]]; then
    restore_nginx
  fi

  rm -rf "${TMP_DIR}"
  trap - EXIT
  exit "${status}"
}
trap cleanup EXIT

fail() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

restore_nginx() {
  if [[ -n "${BACKUP_CONFIG}" && -f "${BACKUP_CONFIG}" && -n "${ACTIVE_CONFIG}" ]]; then
    cp -a "${BACKUP_CONFIG}" "${ACTIVE_CONFIG}"
    if nginx -t >/dev/null 2>&1; then
      systemctl reload nginx >/dev/null 2>&1 || true
    fi
  fi
}

[[ "${EUID}" -eq 0 ]] || fail "请使用 sudo bash 运行此脚本。"
[[ -d "${SITE_DIR}/.git" ]] || fail "未找到网站目录 ${SITE_DIR}。"
command -v git >/dev/null || fail "服务器未安装 Git。"
command -v nginx >/dev/null || fail "服务器未安装 Nginx。"
command -v openssl >/dev/null || fail "服务器未安装 OpenSSL，无法确认 SSL 证书覆盖的域名。"
command -v curl >/dev/null || fail "服务器未安装 curl，无法完成部署后的本机验收。"

cd "${SITE_DIR}"

if [[ -n "$(git -c safe.directory="${SITE_DIR}" status --porcelain)" ]]; then
  fail "服务器网站目录存在未提交修改，已停止以免覆盖资料。"
fi

git -c safe.directory="${SITE_DIR}" fetch origin master
git -c safe.directory="${SITE_DIR}" merge --ff-only "origin/master"

CURRENT_COMMIT="$(git -c safe.directory="${SITE_DIR}" rev-parse HEAD)"
REMOTE_COMMIT="$(git -c safe.directory="${SITE_DIR}" rev-parse "origin/master")"
[[ "${CURRENT_COMMIT}" == "${REMOTE_COMMIT}" ]] ||
  fail "服务器网站版本未与 GitHub 主分支同步。"
[[ -f "${SITE_DIR}/llms.txt" ]] ||
  fail "更新后的站点缺少新版校验文件 llms.txt。"

nginx -T >"${NGINX_DUMP}" 2>&1 ||
  fail "无法读取现有 Nginx 配置。"

ACTIVE_CONFIG="$(
  awk '
    /^# configuration file / {
      file=$4
      sub(/:$/, "", file)
    }
    $0 ~ /server_name[[:space:]].*deshengtest\.com/ {
      print file
      exit
    }
  ' "${NGINX_DUMP}"
)"

[[ -n "${ACTIVE_CONFIG}" && -f "${ACTIVE_CONFIG}" ]] ||
  fail "未找到 ${DOMAIN} 的 Nginx 配置文件。"

ACTIVE_CONFIG="$(readlink -f "${ACTIVE_CONFIG}")"
[[ "${ACTIVE_CONFIG}" != "/etc/nginx/nginx.conf" ]] ||
  fail "网站配置位于 Nginx 主配置中，已停止自动替换。"

if awk '
  $1 == "server_name" &&
  $0 !~ /deshengtest\.com/ &&
  $0 !~ /server_name[[:space:]]+_;/ {
    found=1
  }
  END { exit(found ? 0 : 1) }
' "${ACTIVE_CONFIG}"; then
  fail "同一个配置文件还包含其他网站，已停止以免影响其他站点。"
fi

CERTIFICATE="$(
  awk '
    $1 == "ssl_certificate" {
      gsub(/;/, "", $2)
      print $2
      exit
    }
  ' "${ACTIVE_CONFIG}"
)"
CERTIFICATE_KEY="$(
  awk '
    $1 == "ssl_certificate_key" {
      gsub(/;/, "", $2)
      print $2
      exit
    }
  ' "${ACTIVE_CONFIG}"
)"

[[ -n "${CERTIFICATE}" && -f "${CERTIFICATE}" ]] ||
  fail "未能确认现有 SSL 证书路径。"
[[ -n "${CERTIFICATE_KEY}" && -f "${CERTIFICATE_KEY}" ]] ||
  fail "未能确认现有 SSL 私钥路径。"

certificate_covers() {
  local hostname="$1"
  local escaped_hostname="${hostname//./\\.}"
  local certificate_names

  certificate_names="$(openssl x509 -in "${CERTIFICATE}" -noout -ext subjectAltName 2>/dev/null)" ||
    return 1
  if printf '%s\n' "${certificate_names}" | grep -Eq "DNS:${escaped_hostname}([,[:space:]]|$)"; then
    return 0
  fi

  if [[ "${hostname}" == *.* ]]; then
    local parent="${hostname#*.}"
    local escaped_parent="${parent//./\\.}"
    printf '%s\n' "${certificate_names}" | grep -Eq "DNS:\\*\\.${escaped_parent}([,[:space:]]|$)"
  else
    return 1
  fi
}

certificate_covers "${DOMAIN}" ||
  fail "SSL 证书不覆盖 ${DOMAIN}，未执行任何 Nginx 修改。"
certificate_covers "${WWW_DOMAIN}" ||
  fail "SSL 证书不覆盖 ${WWW_DOMAIN}，未执行任何 Nginx 修改。"

SSL_OPTIONS=""
SSL_DHPARAM=""
if [[ -f "/etc/letsencrypt/options-ssl-nginx.conf" ]]; then
  SSL_OPTIONS="    include /etc/letsencrypt/options-ssl-nginx.conf;"
fi
if [[ -f "/etc/letsencrypt/ssl-dhparams.pem" ]]; then
  SSL_DHPARAM="    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;"
fi

cat >"${NEW_CONFIG}" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} ${WWW_DOMAIN};
    return 301 https://${WWW_DOMAIN}\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN};

    ssl_certificate ${CERTIFICATE};
    ssl_certificate_key ${CERTIFICATE_KEY};
${SSL_OPTIONS}
${SSL_DHPARAM}

    return 301 https://${WWW_DOMAIN}\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${WWW_DOMAIN};

    root ${SITE_DIR};
    index index.html;

    ssl_certificate ${CERTIFICATE};
    ssl_certificate_key ${CERTIFICATE_KEY};
${SSL_OPTIONS}
${SSL_DHPARAM}

    location = /dth.html {
        return 301 /product-constant-temperature-humidity.html;
    }

    location = /dath.html {
        return 301 /product-walk-in-chamber.html;
    }

    location = /rapid-temperature.html {
        return 301 /product-rapid-temperature.html;
    }

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        application/javascript
        application/json
        application/xml
        application/rss+xml
        image/svg+xml;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()" always;
    add_header Content-Security-Policy "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; img-src 'self' data:; object-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; upgrade-insecure-requests" always;

    location / {
        try_files \$uri \$uri/ =404;
    }

    location ~* \.(?:css|js|webp|png|jpg|jpeg|svg|ico|woff|woff2)$ {
        expires 1y;
        try_files \$uri =404;
    }

    location ~* \.(?:html|xml|txt|webmanifest)$ {
        expires 5m;
        try_files \$uri =404;
    }
}
EOF

BACKUP_CONFIG="${ACTIVE_CONFIG}.backup-${TIMESTAMP}"
cp -a "${ACTIVE_CONFIG}" "${BACKUP_CONFIG}"
install -m 0644 "${NEW_CONFIG}" "${ACTIVE_CONFIG}"
CONFIG_REPLACED=1

if ! nginx -t; then
  fail "新配置测试失败，正在恢复原配置。"
fi

systemctl reload nginx

curl -fsS -o /dev/null \
  --resolve "${WWW_DOMAIN}:443:127.0.0.1" \
  "https://${WWW_DOMAIN}/" ||
  fail "Nginx 已重新载入，但本机网站检查失败，正在恢复原配置。"

assert_redirect() {
  local scheme="$1"
  local host="$2"
  local path="$3"
  local expected_location="$4"
  local port="80"
  local headers
  local status
  local location

  if [[ "${scheme}" == "https" ]]; then
    port="443"
  fi

  headers="$(curl -sS -D - -o /dev/null --max-redirs 0 \
    --resolve "${host}:${port}:127.0.0.1" \
    "${scheme}://${host}${path}")" ||
    fail "本机 ${scheme}://${host}${path} 检查失败。"
  status="$(printf '%s\n' "${headers}" | awk 'NR == 1 { print $2 }')"
  location="$(printf '%s\n' "${headers}" | awk 'tolower($1) == "location:" { sub(/^[^:]*:[[:space:]]*/, ""); print; exit }' | tr -d '\r')"

  [[ "${status}" == "301" && "${location}" == "${expected_location}" ]] ||
    fail "${scheme}://${host}${path} 未得到预期 301：status=${status:-空} location=${location:-空}。"
}

assert_redirect "http" "${DOMAIN}" "/" "https://${WWW_DOMAIN}/"
assert_redirect "https" "${DOMAIN}" "/" "https://${WWW_DOMAIN}/"
assert_redirect "https" "${WWW_DOMAIN}" "/dth.html" "https://${WWW_DOMAIN}/product-constant-temperature-humidity.html"
assert_redirect "https" "${WWW_DOMAIN}" "/dath.html" "https://${WWW_DOMAIN}/product-walk-in-chamber.html"
assert_redirect "https" "${WWW_DOMAIN}" "/rapid-temperature.html" "https://${WWW_DOMAIN}/product-rapid-temperature.html"

printf 'DEPLOY_OK commit=%s config=%s backup=%s\n' \
  "${CURRENT_COMMIT:0:7}" "${ACTIVE_CONFIG}" "${BACKUP_CONFIG}"
