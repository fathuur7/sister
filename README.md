# TransVidio - Video Translation & Subtitling Platform

TransVidio is a powerful web application designed to automatically transcribe and translate videos. It provides a seamless interface for uploading videos, generating subtitles using AI, editing translations, customizing subtitle styles, and exporting the final result.

## 🚀 Features

-   **Video Upload**: Support for common video formats (MP4, MKV, etc.).
-   **AI Transcription**: Utilizes OpenAI's Whisper model for accurate speech-to-text.
-   **Auto-Translation**: Automatically translates subtitles into target languages.
-   **Interactive Editor**: Real-time subtitle editing with a synchronized video player.
-   **Subtitle Styling**: Customize font, size, color, background, and position of subtitles.
-   **Video Review**: Built-in player with seek controls (-5s/+5s) for easy review.
-   **Export**: Download the translated subtitles as `.srt` files.

## 🛠️ Tech Stack

### Frontend
-   **Framework**: React (Vite)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS, Shadcn UI
-   **Icons**: Lucide React
-   **State Management**: React Hooks

### Backend
-   **Framework**: FastAPI
-   **Language**: Python
-   **AI Models**: OpenAI Whisper (Transcription), Deep Translator (Translation)
-   **Video Processing**: MoviePy, FFmpeg
-   **Authentication**: JWT, Google OAuth2 (supported dependencies)

## 📋 Prerequisites

Before running the project, ensure you have the following installed:
-   **Node.js** (v16+) & **npm**
-   **Python** (v3.8+)
-   **FFmpeg**: Required for audio/video processing. Ensure it's added to your system PATH.

## ⚙️ Installation & Setup

### 1. Backend Setup

Navigate to the backend directory:
```bash
cd translate-backend
```

Create a virtual environment (optional but recommended):
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Run the backend server:
```bash
python -m uvicorn app.main:app --reload
```
The API will be available at `http://localhost:8000`.

### 2. Frontend Setup

Navigate to the frontend directory:
```bash
cd transvidio-frontend
```

Install dependencies:
```bash
npm install
```

Create a `.env` file in the `transvidio-frontend` directory (if not exists) and configure the API URL:
```env
VITE_API_BASE_URL=http://localhost:8000
```

Run the development server:
```bash
npm run dev
```
The application will be available at `http://localhost:8080` (or the port shown in your terminal).

## 📖 Usage Guide

1.  **Upload Video**: Drag and drop a video file onto the upload area.
2.  **Select Language**: Choose the target language for translation.
3.  **Process**: Click "Start Processing". The backend will transcribe and translate the video.
4.  **Review & Edit**:
    *   Use the video player to review the content.
    *   Click on any subtitle segment in the list to edit the text.
    *   Use the "Subtitle Styling" panel to adjust the look of the subtitles on the video.
5.  **Download**: Click "Download SRT" to save the translated subtitles to your computer.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

[MIT](LICENSE)
