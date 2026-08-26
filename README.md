# 東莞市得聲試驗儀器設備有限公司網站

正式公開網址：`https://www.deshengtest.com/`

## 發布架構

GitHub 是原始碼與版本來源；正式網站運行在中國大陸的阿里雲 ECS。現階段沒有 GitHub Pages 自動發布流程，也沒有 GitHub Actions 自動部署。

正式發布流程是：

1. 在 GitHub 完成分支審核，將要發布的內容合併到 `master`。
2. SSH 登入阿里雲 ECS，在伺服器網站倉庫目錄確認工作區乾淨。
3. 執行 `sudo bash deploy/update-mainland-server.sh`。
4. 部署腳本從 `origin/master` 快進同步檔案，檢查 `llms.txt`、SSL 憑證與 Nginx 設定，重新載入 Nginx，並執行本機網址與 301 驗收。

腳本預設網站目錄為 `/var/www/deshengtest`，若伺服器配置不同，需先同步調整部署腳本中的 `SITE_DIR`。

## 搜尋引擎提交

`deploy/submit-mainland-search.sh` 會讀取根目錄 `sitemap.xml`，在部署完成後可選擇提交百度與 IndexNow。兩個憑證都只放在 ECS 的環境變數，不得寫入 Git、README 或部署輸出：

- `BAIDU_TOKEN`：百度主動推送 API token；未設定時自動跳過。
- `INDEXNOW_KEY`：IndexNow 金鑰；未設定時自動跳過，並需在網站根目錄放置同值的 `${INDEXNOW_KEY}.txt` 公開金鑰檔。

若要在部署時啟用環境變數，請在 ECS 的受控 shell 中設定後使用保留環境變數的方式執行部署，例如 `sudo -E bash deploy/update-mainland-server.sh`。token 不要貼到命令歷史、Issue 或日誌。

## 站點檔案與檢查

- `robots.txt`：搜尋引擎索引規則與 sitemap 位置
- `sitemap.xml`：正式網站提交用網址清單
- `llms.txt`：部署驗收用站點內容索引
- `deploy/nginx-site-hardening.conf`：Nginx 安全標頭與站點配置參考
- `tools/generate_product_pages.js`：由產品資料生成靜態產品頁與完整規格表
- `tools/site-footer-data.js`：統一維護 footer 資料與詢價信箱（目前仍為 `jason@tw-vision.com.cn`）
- `tools/generate_site_footer.js`：由上述資料生成靜態 footer、JS fallback 與站內信箱引用

修改產品或 footer 資料後，先在本機重新生成並完成檢查，再進行分支審核與部署。網站是展示與詢價型站點，不提供訪客登入、付款或會員功能。
