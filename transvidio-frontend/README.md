# 🎬 TransVidio Frontend

<div align="center">

![React](https://img.shields.io/badge/React-18-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
![Vite](https://img.shields.io/badge/Vite-5.0-purple.svg)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-cyan.svg)
![Shadcn UI](https://img.shields.io/badge/Shadcn-UI-black.svg)

**Modern, interactive video translation and subtitling interface.**

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Components](#-components)

</div>

---

## 📖 Overview

TransVidio Frontend is a modern React application built with Vite and TypeScript. It provides a seamless user experience for uploading videos, managing translations, and customizing subtitles. The interface is designed to be intuitive, responsive, and visually appealing using Tailwind CSS and Shadcn UI.

---

## ✨ Features

### Core Functionality
- 📤 **Drag & Drop Upload** - Easy video upload interface.
- 🎥 **Video Player** - Custom video player with subtitle overlay.
- ⏭️ **Seek Controls** - Rewind (-5s) and Fast Forward (+5s) buttons for efficient review.
- 📝 **Subtitle Editor** - Real-time editing of translated subtitles.
- 🎨 **Style Customization** - Customize subtitle font, size, color, background, and position.
- 💾 **Export** - Download the final translated subtitles as `.srt`.

### Technical Highlights
- ⚡ **Vite** - Lightning-fast development and build tool.
- 📐 **TypeScript** - Type-safe code for better maintainability.
- 💅 **Tailwind CSS** - Utility-first styling for rapid UI development.
- 🧩 **Shadcn UI** - Reusable, accessible components built on Radix UI.
- 🔄 **Real-time Progress** - Polls the backend for translation job status.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** or **yarn**

### 1. Install Dependencies

```bash
cd transvidio-frontend
npm install
```

### 2. Configure Environment

Create a `.env` file in the `transvidio-frontend` directory:

```env
VITE_API_BASE_URL=http://localhost:8000
```

### 3. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:8080` (check terminal for exact port).

---

## 🏗️ Project Structure

```
src/
├── components/
│   ├── ui/                 # Shadcn UI components (Button, Toast, etc.)
│   ├── Navbar.tsx          # Application navigation bar
│   ├── UploadPanel.tsx     # Video upload and configuration
│   ├── VideoReviewPanel.tsx# Video player with controls and subtitles
│   ├── TranslationPanel.tsx# Subtitle list, editor, and style controls
│   └── SubtitleStylePanel.tsx # Styling controls (font, color, etc.)
├── hooks/
│   ├── use-vidio.tsx       # Core logic for video processing and player state
│   └── use-toast.ts        # Toast notification hook
├── pages/
│   └── Index.tsx           # Main application page layout
├── utils/
│   └── fileUtils.ts        # Helpers for SRT parsing and generation
├── App.tsx                 # Root component
└── main.tsx                # Entry point
```

---

## 📖 Usage Guide

1.  **Upload**: Drag a video file into the upload zone or click to select.
2.  **Configure**: Select the target language for translation.
3.  **Process**: Click "Start Processing". The app will send the video to the backend.
4.  **Review**:
    *   Watch the video with the generated subtitles.
    *   Use the **-5s** and **+5s** buttons to navigate quickly.
5.  **Edit**:
    *   Click "Edit" on any subtitle segment to correct the text.
    *   Click "Save" to apply changes.
6.  **Style**:
    *   Use the styling panel to change font family, size, colors, and position.
    *   Changes update in real-time on the video player.
7.  **Download**: Click "Download SRT" to get your file.

---

## 🤝 Contributing

1.  Fork the repository
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
