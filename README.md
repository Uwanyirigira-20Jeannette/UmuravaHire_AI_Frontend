# UmuravaHire_AI_Frontend
AI-powered recruitment platform frontend built with Next.js for screening, ranking, and shortlisting candidates with explainable insights.
# UmuravaHire AI – Frontend

UmuravaHire AI Frontend is a modern recruiter-facing web application built with Next.js and Tailwind CSS. It provides an intuitive interface for creating job postings, uploading candidate data, and visualizing AI-generated candidate rankings and insights.

## Features

* Job creation and management
* Candidate upload (CSV, Excel, PDF)
* AI-powered screening trigger
* Ranked shortlist display (Top 10 / Top 20)
* Candidate insights:

  * Match score
  * Strengths
  * Gaps
  * AI recommendations
* Clean and responsive dashboard UI

## Tech Stack

* Next.js (React Framework)
* TypeScript
* Tailwind CSS
* Redux Toolkit (State Management)
* Axios (API communication)

## Purpose

This frontend is designed to enhance recruiter productivity by presenting complex AI screening results in a simple, visual, and actionable format.

## Backend Connection

The frontend communicates with the backend API to:

* Send job and candidate data
* Trigger AI screening
* Fetch ranked results

Environment variable required:

NEXT_PUBLIC_API_URL=your_backend_url

## Installation

```bash
npm install
npm run dev
```

## 🌐 Deployment

Recommended: Vercel
