# SmartBook AI Store

SmartBook AI Store is an intelligent e-commerce platform that combines a seamless frontend built with React, Vite, and Tailwind CSS with a powerful Flask backend powered by AI recommendations and conversational data.

## Project Overview
The platform features:
- **Intelligent Catalog**: Trending, Bestsellers, Deals, and AI Picks.
- **AI Chatbot Assistant**: Ask for book recommendations conversationally.
- **Secure Cart & Checkout Flow**: Session-based cart storage and simulated secure checkout.
- **Google Analytics 4**: Pre-configured hooks for sophisticated e-commerce tracking.

## Repository Structure
```
smartbookstore/
├── frontend/                 # React + Vite UI Application
│   ├── src/                  # React components, pages, and API services
│   ├── index.html            # Vite entry
│   ├── package.json          # Node dependencies
│   ├── tailwind.config.js    # Tailwind 'indigo_ethereal' theme
│   └── .env.example          # Environment variables template
├── smartbook_flask_api.py    # Flask backend server
├── smartbook_ai_pipeline.py  # AI recommendation models and vector logic
├── vectorizer.pkl            # Pre-trained NLP vectorizer
├── similarity.npy            # Similarity matrix for recommendations
└── smartbook_catalog.csv     # Book database
```

## Backend Setup (Flask API)
1. Ensure Python 3.9+ is installed.
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install flask flask-cors pandas scikit-learn numpy
   ```
4. Run the server:
   ```bash
   python smartbook_flask_api.py
   ```
The API will run on `http://localhost:5000`.

## Frontend Setup (React + Vite)
1. Ensure Node.js (v18+) is installed.
2. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
3. Copy the environment variables template and configure it:
   ```bash
   cp .env.example .env
   ```
   *Note: Google Analytics will only work if `VITE_GA_MEASUREMENT_ID` is provided. If left blank or missing, analytics will gracefully log to the console.*
4. Install dependencies:
   ```bash
   npm install
   ```
5. Run the development server:
   ```bash
   npm run dev
   ```
The application will launch and proxy defaults to the Flask backend configuration.
