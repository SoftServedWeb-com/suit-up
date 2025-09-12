# Try-On BytePlus API - ModelArk Seedream Integration

This is a beta endpoint that uses BytePlus ModelArk's Seedream 4.0 model for virtual try-on functionality.

## Endpoint
`POST /api/try-on-byteplus`

## Key Features

1. **AI Provider**: Uses BytePlus ModelArk Seedream 4.0 (seedream-4-0-250828)
2. **API Method**: Uses image generation API with base image and text prompt
3. **Processing**: Synchronous processing - returns result immediately
4. **High Quality**: Supports 2K resolution image generation
5. **Provider Field**: Response includes `"provider": "byteplus"` to distinguish from other APIs
6. **Rate Limiting**: Includes exponential backoff retry mechanism

## API Reference
Based on [BytePlus ModelArk Image Generation API](https://docs.byteplus.com/en/docs/ModelArk/1541523)

## Request Format
Same as other try-on APIs:
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
  "predictionId": "byteplus-uuid",
  "status": "completed",
  "resultImageUrl": "https://generated-image-url",
  "message": "Virtual try-on completed successfully using BytePlus ModelArk Seedream.",
  "creditsRemaining": 19,
  "provider": "byteplus",
  "model": "seedream-4-0-250828"
}
```

## Environment Variables Required
- `ARK_API_KEY`: BytePlus ModelArk API key
- All existing S3 and database environment variables

## Model Specifications
- **Model**: seedream-4-0-250828 (Seedream 4.0)
- **Resolution**: 2K (2048x2048)
- **Format**: URL response
- **Watermark**: Disabled for cleaner results
- **Sequential Generation**: Disabled for single image output

## API Configuration
```javascript
const requestBody = {
  model: "seedream-4-0-250828",
  prompt: "Virtual try-on prompt with clothing category",
  image: "base_image_url", // Person's photo
  sequential_image_generation: "disabled",
  response_format: "url",
  size: "2K",
  stream: false,
  watermark: false
};
```

## Error Handling
- **Rate Limiting**: 429 errors with exponential backoff retry
- **Authentication**: 401 errors for invalid API keys
- **API Errors**: Comprehensive error classification
- **Credit System**: Integration with existing subscription system

## Usage Notes
- This endpoint uses the person's image as the base and applies the garment through text prompting
- Different approach from Gemini's multi-image input method
- Suitable for A/B testing against other providers
- Results may vary in style and quality compared to other models

## Getting Started
1. Get API key from [BytePlus ModelArk](https://console.byteplus.com/modelark)
2. Add `ARK_API_KEY` to your environment variables
3. Test the endpoint through the beta dashboard

## Comparison with Other Providers

| Feature | Fashn AI | Gemini AI | BytePlus ModelArk |
|---------|----------|-----------|------------------|
| Processing | Async (20-40s) | Sync (instant) | Sync (instant) |
| Input Method | Form data | Multi-image + text | Base image + prompt |
| Resolution | Standard | Standard | 2K (2048x2048) |
| Watermark | None | None | Configurable |
| Rate Limits | Custom | Free tier limits | API tier limits |
