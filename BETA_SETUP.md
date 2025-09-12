# Beta Feature Setup - Google Gemini Integration

## Overview
This beta feature integrates Google's Gemini 2.5 Flash Image Preview model for instant virtual try-on capabilities using the new `@google/genai` package.

## Required Environment Variables

Add the following environment variable to your `.env.local` file:

```bash
# Google Gemini AI (beta try-on API)
GEMINI_API_KEY=your_google_gemini_api_key
```

## How to Get Google Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Create a new API key
4. Copy the API key and add it to your environment variables

## New Routes Created

### API Route
- **Path**: `/api/try-on-beta`
- **Method**: POST
- **Description**: Handles beta virtual try-on using Google Gemini AI
- **Response**: Instant results with generated image URL

### Frontend Route
- **Path**: `/dashboard-beta`
- **Description**: Beta dashboard for testing Gemini AI integration
- **Features**: 
  - Instant image generation
  - Beta-specific UI with Gemini branding
  - Separate history tracking for beta sessions
  - Navigation back to main dashboard

## Key Differences from Main API

| Feature | Main API (Fashn AI) | Beta API (Gemini AI) |
|---------|---------------------|---------------------|
| Processing | Asynchronous (20-40s) | Synchronous (instant) |
| Provider | Fashn AI | Google Gemini 2.5 Flash |
| Package | Custom integration | @google/genai |
| Response | Polling required | Immediate result |
| UI Indicators | Standard branding | Beta badges & Gemini branding |
| History | Combined with main | Separate beta history |

## Usage

1. Navigate to `/dashboard-beta` or click "Try Beta Lab" from main dashboard
2. Upload model and garment images (same as main dashboard)
3. Select clothing category
4. Click "Generate Beta Try-On"
5. Get instant results powered by Google Gemini AI

## Testing

The beta page includes:
- ✅ Image upload functionality
- ✅ Category selection
- ✅ Instant AI generation
- ✅ Result display and download
- ✅ Separate history tracking
- ✅ Error handling
- ✅ Subscription credit system integration

## Notes

- Uses the same credit system as the main API
- Results are stored in the same database with `gemini-` prefixed prediction IDs
- All existing S3 and database infrastructure is reused
- Beta sessions are filtered and displayed separately in the beta dashboard
- Navigation between main and beta dashboards is seamless
