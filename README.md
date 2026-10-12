# Volticen Media Studio & Converter Suite

> Modern, client-first image optimization, screenshot annotation & mockup studio, collage stitcher, and multi-tenant BYOS cloud storage explorer.

<img width="1828" height="957" alt="Image" src="https://github.com/user-attachments/assets/cff73ce0-4e1c-4d02-be57-a0a5a8cfe10b" />

[English](#english) &bull; [Tiếng Việt](#tiếng-việt)

---

<a name="english"></a>
## English

### 🚀 Key Features

Built on **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS v4**, and **Lucide Icons**:

- **`/converter` (Bulk Image Optimizer)**:
  - Batch convert images to **WebP, AVIF, PNG, and JPEG** with *Zero-Retention Canvas & GC Breathing Room* algorithm to prevent browser memory exhaustion.
  - **Batch Watermark Overlay**: Text and Logo image watermarks with real-time live preview, custom WYSIWYG pixel sizing, 9-anchor alignment, and 45° repeating tile patterns.
  - Smart downscaling by max width presets (1080p, 2K, 4K, or custom).
  - SEO-friendly file renaming and instant multi-size ZIP bundle generation.
  - Built-in e-commerce presets (Shopee, Lazada, TikTok Shop, Shopify).
- **`/studio` (Screenshot Annotation & Mockup Studio)**:
  - Professional annotations: arrows (straight/curved), auto-incrementing step badges, rectangles, blur/privacy masks, spotlight effect, text labels.
  - Mockup frames: macOS window header (traffic light buttons), Google Chrome browser bar, or clean transparent canvas.
  - Flexible watermark and brand attribution stamps.
  - Viewport-aware Fit to screen (`Ctrl + 0`) and precision zoom controls.
- **`/stitcher` (Multi-layer Image Stitcher & Collage)**:
  - Combine multiple images horizontally, vertically, or in smart auto-grid arrangements.
  - Interactive Before & After comparison slider.
- **`/cloud-explorer` (Cloud Storage Explorer - S3 / R2 BYOS)**:
  - Visual file & directory explorer for Cloudflare R2 / AWS S3: folder creation, renaming, deletion, and 1-click open into Studio for editing.
  - Real-time search, directory tree view, and file size statistics.
- **`/settings` (Storage & Workspace Settings)**:
  - **100% Client-Side BYOS**: Your Cloudflare R2 / AWS S3 API credentials are stored securely in your browser (IndexedDB / localStorage). No server-side `.env` configuration required.

---

### 🛡️ 100% Client-Side Processing Architecture

- **Zero Server Overhead**: Image resizing, canvas composition, format conversion, and ZIP archiving execute entirely within the user's browser using HTML5 Canvas and Web APIs.
- **Data Privacy**: Your images and Cloud credentials never stay on the web server.

---

### 🛠️ Getting Started (Local Setup)

#### Prerequisites
- Node.js 18.18+ or 20+

#### Installation & Development
```bash
# 1. Clone repository
git clone https://github.com/heykentran-collab/convert-img-open.git
cd convert-img-open

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open `http://localhost:3000` in your browser.

---

### ☁️ Deployment

#### 1. Cloudflare Pages / Workers
This repository includes a preconfigured `wrangler.jsonc` file with the `nodejs_compat` compatibility flag enabled:
1. Go to **Cloudflare Dashboard > Workers & Pages > Create Application > Pages > Connect to Git**.
2. Select your repository.
3. Configure build settings:
   - **Framework preset:** `Next.js`
   - **Build command:** `npx @opennextjs/cloudflare build` *(or `npm run build`)*
   - **Output directory:** `.worker-next`
   - **Environment variable:** `NODE_VERSION = 20`
4. Click **Save and Deploy**.

#### 2. Vercel
Connect your repository to Vercel for zero-configuration App Router deployment.

#### 3. Self-Hosted VPS (Node.js)
```bash
npm run build
npm run start
```
Serve behind Nginx or a free Cloudflare Tunnel (`cloudflared`).

---

### 📄 License

This project is licensed under the open-source **[MIT License](LICENSE)**.

---

<a name="tiếng-việt"></a>
## Tiếng Việt

### 🚀 Tính năng nổi bật

Được xây dựng trên nền tảng **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS v4** và **Lucide Icons**:

- **`/converter` (Bộ chuyển đổi & Tối ưu ảnh hàng loạt)**:
  - Chuyển đổi hàng loạt sang **WebP, AVIF, PNG, JPEG** với thuật toán giải phóng bộ nhớ *Zero-Retention Canvas & GC Breathing Room*.
  - **Đóng dấu Watermark hàng loạt**: Hỗ trợ cả chữ và Logo ảnh, xem trước thời gian thực (Live Preview), kích thước tùy biến WYSIWYG chuẩn pixel, 9 vị trí góc/cạnh và hoa văn chéo 45°.
  - Giảm kích thước thông minh theo độ phân giải (1080p, 2K, 4K hoặc tự chọn).
  - Tự động chuẩn hóa tên file chuẩn SEO và đóng gói file ZIP tức thì.
  - Sẵn bộ Preset kích thước chuẩn cho sàn Thương mại điện tử (Shopee, Lazada, TikTok Shop, Shopify).
- **`/studio` (Studio Chỉnh sửa, Mockup & Chú thích ảnh)**:
  - Bộ công cụ chú thích chuyên nghiệp: mũi tên (thẳng/cong), đánh số bước tự động (Step Counter), đóng khung chữ nhật, che mờ (Blur riêng tư), rọi sáng (Spotlight), chèn chữ.
  - Khung Mockup: macOS 3 nút, Google Chrome Browser bar, hoặc Canvas trong suốt.
  - Đóng dấu Watermark bản quyền linh hoạt.
  - Khớp vừa màn hình chuẩn xác theo hình học viewport (Fit to screen - `Ctrl + 0`).
- **`/stitcher` (Ghép ảnh đa tầng & So sánh Before/After)**:
  - Ghép nhiều ảnh ngang/dọc, chia lưới thông minh và thanh trượt so sánh Before/After.
- **`/cloud-explorer` (Trình quản lý kho Cloud Storage - S3 / R2 BYOS)**:
  - Quản lý tệp và thư mục Cloudflare R2 / AWS S3 trực quan: tạo thư mục, đổi tên, xóa tệp, mở trực tiếp vào Studio để chỉnh sửa.
  - Tìm kiếm thời gian thực, duyệt cây thư mục và thống kê dung lượng.
- **`/settings` (Cài đặt lưu trữ & Không gian làm việc)**:
  - **100% Client-Side BYOS**: Thông tin kết nối R2/S3 được lưu trực tiếp trong trình duyệt người dùng (IndexedDB / localStorage). Web server không lưu trữ và không yêu cầu file `.env`.

---

### 🛡️ Kiến trúc xử lý 100% Phía Trình duyệt

- **Tiết kiệm tài nguyên Server**: Mọi thao tác nén ảnh, xử lý đồ họa, ghép ảnh và xuất ZIP đều chạy trực tiếp trên GPU/CPU của máy người dùng.
- **Bảo mật tuyệt đối**: Dữ liệu ảnh và thông tin tài khoản Cloud không lưu lại trên máy chủ.

---

### 🛠️ Cài đặt & Khởi chạy Cục bộ

#### Yêu cầu
- Node.js 18.18+ hoặc 20+

#### Cài đặt
```bash
# 1. Cài đặt thư viện
npm install

# 2. Khởi chạy môi trường phát triển
npm run dev
```

Mở trình duyệt tại: `http://localhost:3000`

---

### ☁️ Hướng dẫn Triển khai

#### 1. Triển khai lên Cloudflare (Cloudflare Pages / Workers)
Dự án đã có sẵn file `wrangler.jsonc` với cờ tương thích `nodejs_compat`:
1. Vào **Cloudflare Dashboard > Workers & Pages > Create Application > Pages > Connect to Git**.
2. Chọn repository GitHub của bạn.
3. Cấu hình build:
   - **Framework preset:** `Next.js`
   - **Build command:** `npx @opennextjs/cloudflare build` *(hoặc `npm run build`)*
   - **Output directory:** `.worker-next`
   - **Environment variable:** `NODE_VERSION = 20`
4. Bấm **Save and Deploy**.

#### 2. Triển khai lên Vercel
Kết nối repo với Vercel để triển khai tự động (Zero-config).

#### 3. Chạy trên VPS riêng (Node.js)
```bash
npm run build
npm run start
```
Kết hợp cùng Nginx hoặc Cloudflare Tunnel (`cloudflared`) hoàn toàn miễn phí.

---

### 📄 Bản quyền (License)

Dự án được phát hành theo giấy phép mã nguồn mở **[MIT License](LICENSE)**.
