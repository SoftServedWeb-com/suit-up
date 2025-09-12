# Try-On Beta API - Google Gemini Integration

This is a beta endpoint that uses Google's Gemini 2.5 Flash Image Preview model (Nano Banana) for virtual try-on functionality using the `@google/genai` package.

## Endpoint
`POST /api/try-on-beta`

## Key Differences from Main Try-On API

1. **AI Provider**: Uses Google Gemini 2.5 Flash Image Preview (Nano Banana) instead of Fashn AI
2. **API Method**: Uses `generateContent` method with multiple input images
3. **Processing**: Synchronous processing - returns result immediately
4. **Input Format**: Text prompt + two images (person + garment) as inlineData
5. **Response**: Includes the generated image URL directly in the response
6. **Provider Field**: Response includes `"provider": "gemini"` to distinguish from main API
7. **Rate Limiting**: Includes exponential backoff retry mechanism for quota handling

## Request Format
Same as the main try-on API:
- `modelImage`: File (user's photo)
- `garmentImage`: File (clothing item)
- `previousModelImage`: String (optional, URL of previously uploaded model image)
- `previousGarmentImage`: String (optional, URL of previously uploaded garment image)
- `category`: String (clothing category)

## Response Format
```json
{
  "success": true,
  "requestId": "cuid",
  "predictionId": "gemini-uuid",
  "status": "completed",
  "resultImageUrl": "https://s3-url-to-generated-image",
  "message": "Virtual try-on completed successfully using Google Gemini AI.",
  "creditsRemaining": 19,
  "provider": "gemini",
  "textResponse": "Additional text from Gemini AI"
}
```

## Environment Variables Required
- `GEMINI_API_KEY`: Google Gemini API key
- All existing S3 and database environment variables

## Features
- Real-time image generation
- Maintains person's physical characteristics
- Natural garment fitting
- High-quality photorealistic results
- Same credit system as main API
- Error handling and validation

## Usage Notes
- This is a beta feature for testing Google Gemini's image generation capabilities
- Processing is typically faster than the main API as it's synchronous
- Results may vary compared to Fashn AI
- Suitable for A/B testing and comparison purposes
