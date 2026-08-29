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

## 询价表单（Web3Forms）

`contact.html`、`catalog-specs.html` 與 14 個 `product-*.html` 的询价表单，以及规格总表 PDF 下载的邮箱收集，全部由 `inquiry-form.js` 渲染，提交到 Web3Forms（https://web3forms.com，纯前端表单服务，无后端）。

### 申请与设置（首次）

1. 到 https://web3forms.com 输入收件信箱 `jason@tw-vision.com.cn` 申请 access key。
2. 到该信箱收验证邮件（收不到先查垃圾邮件），取得 access key。
3. 打开 `inquiry-form.js`，把最上方的 `ACCESS_KEY = "YOUR_WEB3FORMS_ACCESS_KEY"` 换成取得的 key。
4. 部署后任一表单送出一笔测试资料，确认信箱收到即完成。

### 测试

- 本地预览：`python -m http.server` 或直接双击 `contact.html`，填必填栏位（公司名称／联系人／电子邮箱）送出。
- 未设置 access key 时送出会显示「表单服务尚未设置」提示；规格总表 PDF 在未设置状态下会直接开放下载（不收集邮箱）。

### 日后更换收件信箱

**只需要登录 Web3Forms 后台修改收件地址，不用改任何 HTML/JS。** 这是选 Web3Forms 而非 FormSubmit 的原因：FormSubmit 把信箱写死在 endpoint 网址里，换信箱等于全站表单重来。

### 风险与备选

Web3Forms 主机在海外；收件为大陆信箱（企业邮箱／QQ／163）时，跨境寄信可能有延迟或被拦的风险，重要客户请同时以页面上的电话／邮箱直联兜底。若送达率不佳，备选方案：Formspree（同样 access key 模式，改 `inquiry-form.js` 的 `ENDPOINT` 与 `ACCESS_KEY` 即可）、或日后在 ECS 上加一个轻量表单收信接口。

### 维护

- 栏位定义、必填规则、产品名隐藏栏位全部集中在 `inquiry-form.js` 的 `FIELDS`；各页面只放 `<div data-inquiry-form data-product="产品名称"></div>` 占位。
- 规格总表 PDF：`assets/DSON-spec-sheet.pdf`，换档时同名覆盖即可，下载链接不用改。
