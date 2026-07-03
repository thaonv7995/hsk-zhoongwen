#!/bin/bash
set -e

REPO="thaonv7995/hsk-zhoongwen"
INSTALL_DIR="/opt/zizhi-hsk"
PORT=29579
SERVICE_NAME="zizhi-hsk"
BIN_PATH="/usr/local/bin/zizhi-hsk"

if [ "$EUID" -ne 0 ]; then
  echo "Vui lòng chạy lệnh bằng quyền root (thêm sudo)."
  exit 1
fi

ACTION=${1:-install}

get_latest_release_url() {
  curl -s "https://api.github.com/repos/$REPO/releases/latest" | grep "browser_download_url.*zizhi-hsk-release.tar.gz" | cut -d : -f 2,3 | tr -d \" | xargs
}

do_install() {
  echo "==> Đang kiểm tra môi trường..."
  if ! command -v node > /dev/null; then
    echo "==> Node.js chưa được cài đặt. Đang tiến hành cài đặt Node.js 22..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
  fi

  if ! command -v serve > /dev/null; then
    echo "==> Đang cài đặt web server (serve)..."
    npm install -g serve
  fi

  echo "==> Đang tải phiên bản ứng dụng mới nhất..."
  DOWNLOAD_URL=$(get_latest_release_url)
  if [ -z "$DOWNLOAD_URL" ]; then
    echo "Không tìm thấy bản release nào trên GitHub."
    exit 1
  fi

  mkdir -p "$INSTALL_DIR"
  curl -sL "$DOWNLOAD_URL" | tar -xz -C "$INSTALL_DIR"

  echo "==> Đang cài đặt công cụ quản lý hệ thống (CLI)..."
  curl -sL "https://raw.githubusercontent.com/$REPO/main/install.sh" -o "$BIN_PATH"
  chmod +x "$BIN_PATH"

  echo "==> Đang cấu hình systemd service ($SERVICE_NAME)..."
  SERVE_BIN=$(command -v serve)
  cat <<EOF > /etc/systemd/system/$SERVICE_NAME.service
[Unit]
Description=Zizhi HSK Web App
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
ExecStart=$SERVE_BIN -s dist -l $PORT
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

  systemctl daemon-reload
  systemctl enable $SERVICE_NAME
  systemctl restart $SERVICE_NAME

  echo "==> Cài đặt thành công!"
  echo "Ứng dụng đang chạy tại: http://<IP_SERVER>:$PORT"
  echo ""
  echo "Từ giờ, bạn có thể quản lý ứng dụng bằng các lệnh sau:"
  echo "  sudo zizhi-hsk update  # Cập nhật lên bản mới nhất"
  echo "  sudo zizhi-hsk remove  # Gỡ bỏ ứng dụng"
}

do_update() {
  echo "==> Đang cập nhật phiên bản mới nhất..."
  if [ ! -d "$INSTALL_DIR" ]; then
    echo "Ứng dụng chưa được cài đặt ở $INSTALL_DIR."
    exit 1
  fi

  DOWNLOAD_URL=$(get_latest_release_url)
  if [ -z "$DOWNLOAD_URL" ]; then
    echo "Không tìm thấy bản release nào trên GitHub."
    exit 1
  fi

  # Cập nhật lại chính script CLI
  curl -sL "https://raw.githubusercontent.com/$REPO/main/install.sh" -o "$BIN_PATH"
  chmod +x "$BIN_PATH"

  echo "==> Đang tải dữ liệu mới..."
  rm -rf "$INSTALL_DIR/dist"
  curl -sL "$DOWNLOAD_URL" | tar -xz -C "$INSTALL_DIR"

  echo "==> Đang khởi động lại dịch vụ..."
  systemctl restart $SERVICE_NAME
  echo "==> Cập nhật thành công!"
}

do_remove() {
  echo "==> Đang gỡ bỏ ứng dụng và dịch vụ..."
  systemctl stop $SERVICE_NAME || true
  systemctl disable $SERVICE_NAME || true
  rm -f /etc/systemd/system/$SERVICE_NAME.service
  systemctl daemon-reload

  rm -rf "$INSTALL_DIR"
  rm -f "$BIN_PATH"
  
  echo "==> Gỡ bỏ thành công!"
}

case "$ACTION" in
  install)
    do_install
    ;;
  update)
    do_update
    ;;
  remove)
    do_remove
    ;;
  *)
    echo "Sử dụng:"
    echo "  Lần đầu cài đặt: curl -fsSL https://raw.githubusercontent.com/$REPO/main/install.sh | sudo bash"
    echo "  Sau khi cài:     sudo zizhi-hsk {update|remove}"
    exit 1
    ;;
esac
