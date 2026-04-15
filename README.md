# 🎵 NodeTube - Free & Ad-Free Music Experience

[English](#-english) | [Türkçe](#-türkçe)

---

## 🇺🇸 English

**NodeTube** is a high-performance, minimalist Single Page Application (SPA) designed to search, stream, and download music directly from YouTube without ads or tracking. Powered by `Node.js` and `yt-dlp`, it offers a premium music player experience with a modern UI.

### ✨ Features
* **Full PWA Support**: Install NodeTube as a standalone native-like application on Desktop and Mobile devices.
* **Zen & Ambient Modes**: Distraction-free listening with a rotating vinyl UI, and dynamic background colors extracted from track thumbnails.
* **Search & Stream**: Instant music searching using `yt-dlp`.
* **Smart URL Parsing**: Paste YouTube playlist or video links directly into the search bar to instantly load, select, or auto-play content.
* **Ad-Free Experience**: Pure audio streaming without any YouTube ads.
* **Advanced Playlists**: Create, rename, delete, and horizontally sort multiple custom playlists with a modern modal interface.
* **Dynamic Lyrics**: Instantly fetch and display lyrics for the currently playing track via LRCLIB.
* **Smart Navigation**: In-list highlight search (find tracks without breaking the queue), auto-scroll to the currently playing track, and a contextual "Scroll to Top" button.
* **Interactive UI & Visualizer**: Hover-to-play states, animated CSS audio visualizer bars on active tracks, and track queue tracking (e.g., "14/280") in the player.
* **Compact View Mode**: A high-density, text-only list view designed for navigating massive playlists effortlessly, complementing the Grid and List views.
* **Hardware-Accelerated UI**: Silky smooth scrolling for massive playlists using GPU rendering optimizations to prevent screen tearing.
* **Non-Intrusive Notifications**: Sleek, auto-dismissing toast notifications with smart timeout and override handling, replacing blocking loading modals.
* **Personal Library**: Add songs to favorites and save them locally using Browser LocalStorage.
* **Enhanced Player Controls**: Sleek vertical volume slider (with click-to-mute), intelligent shuffle mode (with history tracking), and continuous playback loop.
* **M4A Downloads**: Download your favorite tracks directly to your device as high-quality `.m4a` files.
* **System Integration**: Support for `MediaSession API` to control playback via Windows media panel or lock screen.
* **ModSecurity Bypass**: Implemented HEX-encoded download routing to flawlessly bypass strict server firewalls (e.g., IIS 403 Forbidden).
* **Modular Architecture**: Restructured the codebase into clean, separate files (HTML, CSS, JS, i18n) for better maintainability.
* **Refined Themes**: Eye-friendly Dark Mode and a polished Light Mode using pastel/off-white tones for a premium aesthetic.
* **Expanded Localization**: Full support for English, Turkish, Spanish, German, French, Portuguese, Italian, and Russian via a modern dropdown UI.

### 🛠 Tech Stack
* **Backend**: Node.js, Express.js, CORS.
* **Streaming Engine**: `yt-dlp.exe`.
* **Frontend**: Vanilla JS, CSS3 (Flexbox/Grid), HTML5.

### 🚀 Installation
1. Clone the repository: `git clone https://github.com/trup40/NodeTube.git`
2. Install dependencies: `npm install`.
3. Ensure `yt-dlp.exe` is present in the root directory.
4. Start the server: `npm start`.
5. Open `localhost:3000` in your browser.

### 📄 License
This project is licensed under the ISC License.

### 🦅 Contact
**Developer:** Eagle

**Email:** trup40@protonmail.com

## ☕ Donate

This project is free and open-source. If you find this useful and would like to support the development process, you can buy me a coffee using the crypto addresses below! 🚀

### 🪙 Crypto Donations

| Coin | Network | Wallet Address |
| :--- | :--- | :--- |
| **USDT (Tether)** | **TRC20** (Tron) | `TWxJVQ3PBCd8ZJJVkX2joe8WRGcSCdh8Ws` |
| **BTC (Bitcoin)** | Bitcoin (Bech32)| `bc1q7207qk3wk94a94xvxx43lxawsg69zpm0atvtd8` |
| **ETH (Ethereum)** | ERC20 | `0x1f5A2e35752c6f01c753F334292Fc7635Caeef56` |
| **BNB** | **BSC** (BEP20) | `0x93845c5Fb889C36E072B5683f1616C625C2deBe7` |

> [!IMPORTANT]
> Please ensure that the **Network** selection matches the table exactly. Using the wrong network may result in a permanent loss of funds.

---

## 🇹🇷 Türkçe

**NodeTube**, YouTube üzerinden reklam ve takipçiler olmadan müzik aramanıza, dinlemenize ve indirmenize olanak tanıyan, yüksek performanslı ve minimalist bir Single Page Application (SPA) projesidir. `Node.js` ve `yt-dlp` gücüyle, modern bir arayüzde premium müzik deneyimi sunar.

### ✨ Özellikler
* **Tam PWA Desteği (Uygulama Kurulumu)**: NodeTube'u telefonunuza veya bilgisayarınıza bağımsız ve yerel bir uygulama gibi kurun.
* **Zen ve Ambiyans Modları**: Dönen plak animasyonlu odak modu ve kapak fotoğrafına göre değişen dinamik arka plan aydınlatması ile kesintisiz deneyim.
* **Arama ve Dinleme**: `yt-dlp` kullanarak anlık müzik arama ve oynatma.
* **Akıllı URL Çözümleme**: Arama çubuğuna doğrudan YouTube çalma listesi veya video linki yapıştırarak anında listeleme, çoklu seçim yapma veya otomatik oynatma.
* **Reklamsız Deneyim**: Hiçbir YouTube reklamı olmadan kesintisiz müzik keyfi.
* **Gelişmiş Çalma Listeleri**: Modern bir arayüz ile birden fazla özel çalma listesi oluşturma, yeniden adlandırma, silme ve yatay olarak sıralama.
* **Dinamik Şarkı Sözleri (Lyrics)**: Çalan şarkının sözlerini LRCLIB altyapısıyla anında bulup görüntüleme.
* **Akıllı Navigasyon**: Listeyi bozmayan "sayfada bul" vurgulama araması, çalan şarkıya otomatik kaydırma (auto-scroll) ve pratik "Yukarı Çık" butonu.
* **İnteraktif Arayüz ve Görselleştirici**: Üzerine gelince beliren oynatma ikonları, çalan şarkıda hareket eden mini CSS ekolayzer çubukları ve oynatıcıda anlık sıra takibi (örn. "14/280").
* **Kompakt Görünüm Modu**: Devasa listelerde kolay gezinmek için resimsiz, yüksek yoğunluklu yeni metin odaklı liste görünümü.
* **Donanım Hızlandırmalı Scroll**: Büyük listelerde gezinirken ekran yırtılmasını önleyen, GPU destekli pürüzsüz kaydırma performansı.
* **Zarif Bildirimler**: Ekranı kilitleyen pencereler yerine, hata ezme (override) ve zaman aşımı korumalı akıllı "Toast" (baloncuk) bildirimleri.
* **Kişisel Kütüphane**: Şarkıları favorilere ekleme ve LocalStorage kullanarak tarayıcıda saklama.
* **Gelişmiş Oynatıcı Kontrolleri**: Dikey ses sürgüsü, akıllı geçmiş takibi yapan karışık çalma (shuffle) ve kesintisiz müzik döngüsü (loop).
* **M4A İndirme**: Sevdiğiniz şarkıları yüksek kaliteli `.m4a` dosyası olarak cihaza indirme.
* **Sistem Entegrasyonu**: Windows medya paneli ve kilit ekranı kontrolleri için `MediaSession API` desteği.
* **ModSecurity Bypass**: Katı sunucu güvenlik duvarlarını (örn. IIS 403 Forbidden) hatasız aşmak için HEX kodlamalı gelişmiş indirme rotası.
* **Modüler Mimari**: Daha iyi yönetilebilirlik için kod tabanı temiz ve bağımsız dosyalara (HTML, CSS, JS, i18n) ayrıldı.
* **Geliştirilmiş Temalar**: Göz yormayan Dark mod ve saf beyazlığı kırılarak daha premium pastel tonlara çekilmiş Light mod.
* **Genişletilmiş Dil Desteği**: Şık bir açılır menü ile Türkçe, İngilizce, İspanyolca, Almanca, Fransızca, Portekizce, İtalyanca ve Rusça seçenekleri.

### 🛠 Teknolojiler
* **Sunucu**: Node.js, Express.js, CORS.
* **Motor**: `yt-dlp.exe`.
* **Önyüz**: Vanilla JS, CSS3 (Flexbox/Grid), HTML5.

### 🚀 Kurulum
1. Repoyu klonlayın: `git clone https://github.com/trup40/NodeTube.git`
2. Bağımlılıkları yükleyin: `npm install`.
3. `yt-dlp.exe` dosyasının ana dizinde olduğundan emin olun.
4. Sunucuyu başlatın: `npm start`.
5. Tarayıcınızda `localhost:3000` adresini açın.

### 📄 Lisans
ISC Lisansı altında dağıtılmaktadır. Daha fazla bilgi için `LICENSE` dosyasına bakın.

### 🦅 İletişim

**Geliştirici:** Eagle

**E-posta:** trup40@protonmail.com

## ☕ Bağış Yap

Geliştirdiğim bu yazılım tamamen ücretsiz ve açık kaynaklıdır. Eğer projem işinize yaradıysa, bana bir kahve ısmarlayarak çalışmalarıma destek olabilirsiniz! 🚀

### 🪙 Kripto Para Adreslerim

| Coin | Ağ (Network) | Cüzdan Adresi |
| :--- | :--- | :--- |
| **USDT (Tether)** | **TRC20** (Tron) | `TWxJVQ3PBCd8ZJJVkX2joe8WRGcSCdh8Ws` |
| **BTC (Bitcoin)** | Bitcoin (Bech32)| `bc1q7207qk3wk94a94xvxx43lxawsg69zpm0atvtd8` |
| **ETH (Ethereum)** | ERC20 | `0x1f5A2e35752c6f01c753F334292Fc7635Caeef56` |
| **BNB** | **BSC** (BEP20) | `0x93845c5Fb889C36E072B5683f1616C625C2deBe7` |

> [!IMPORTANT]
> Lütfen gönderim yaparken **Ağ (Network)** seçiminin yukarıdaki tablo ile birebir aynı olduğundan emin olun. Yanlış ağ seçimi varlık kaybına neden olabilir.

---
**⭐ Star this repository if you find it useful!**

**⭐ Çalışmayı faydalı bulduysanız yıldızlamayı unutmayın!**