# Silk Cocoon AI

Silk Cocoon AI is a full-stack AI-powered web application that performs automatic instance segmentation and counting of silk cocoons from tray images. The application uses a React frontend, FastAPI backend, and a Roboflow Workflow for real-time AI inference.

---

## Project Overview

The system allows users to upload an image of a silk cocoon tray. The image is processed by an AI segmentation model, and the application returns:

- Total cocoon count
- Average confidence score
- Processing time
- Segmented output image
- Detection polygons

---

## Features

- Upload cocoon tray images
- AI-powered instance segmentation
- Automatic cocoon counting
- Segmented image visualization
- Confidence score calculation
- Processing time measurement
- Download segmented output
- Responsive web interface

---

## Technology Stack

### Frontend

- React
- TanStack Start
- TypeScript
- Tailwind CSS
- Framer Motion

### Backend

- FastAPI
- Python
- Pillow
- OpenCV

### AI

- Roboflow Workflow
- Instance Segmentation Model

---

## Project Structure

```
silken-forest-view
│
├── backend
│   ├── routers
│   ├── services
│   ├── uploads
│   ├── outputs
│   ├── models
│   ├── main.py
│   └── requirements.txt
│
├── src
│   ├── components
│   ├── routes
│   ├── lib
│   └── assets
│
├── public
├── package.json
└── README.md
```

---

## System Workflow

```
User Uploads Image
        │
        ▼
React Frontend
        │
        ▼
FastAPI Backend
        │
        ▼
Roboflow Workflow
        │
        ▼
Instance Segmentation
        │
        ▼
Statistics Generation
        │
        ▼
Segmented Image
        │
        ▼
Display Results
```

