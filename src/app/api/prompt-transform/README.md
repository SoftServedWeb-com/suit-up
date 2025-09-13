# Prompt Transform API - AI Image Style Transfer

This API endpoint provides AI-powered image transformation using predefined style prompts with Google's Gemini 2.5 Flash Image Preview model.

## Endpoint
`POST /api/prompt-transform`

## Features

- **Style Transfer**: Transform images with predefined artistic styles
- **8 Built-in Prompts**: Vintage, Artistic Portrait, Professional Headshot, Fashion Editorial, Cinematic, Classic B&W, Soft Glow, Urban Street
- **Instant Processing**: Synchronous processing with immediate results
- **High Quality**: Maintains image quality while applying transformations
- **Credit System**: Integrates with existing subscription system

## Request Format

### Form Data Parameters
- `image`: File (required) - The image to transform
- `prompt`: String (required) - The transformation prompt text
- `promptName`: String (required) - Display name of the selected prompt
- `promptId`: String (required) - Unique identifier for the prompt

### Example Request
```javascript
const formData = new FormData();
formData.append("image", imageFile);
formData.append("prompt", "Transform this image into a vintage style with warm sepia tones...");
formData.append("promptName", "Vintage Style");
formData.append("promptId", "vintage-style");

const response = await fetch("/api/prompt-transform", {
  method: "POST",
  body: formData,
});
```

## Response Format

### Success Response
```json
{
  "success": true,
  "requestId": "cuid",
  "predictionId": "prompt-uuid",
  "status": "completed",
  "resultImageUrl": "https://s3-url-to-transformed-image",
  "originalImageUrl": "https://s3-url-to-original-image",
  "message": "Image transformation completed successfully using Gemini AI.",
  "creditsRemaining": 19,
  "provider": "gemini-prompt",
  "promptName": "Vintage Style",
  "promptId": "vintage-style",
  "textResponse": "Image transformation generated successfully"
}
```

### Error Response
```json
{
  "error": "Error message",
  "type": "ERROR_TYPE",
  "provider": "gemini-prompt"
}
```

## Available Transformation Styles

### 1. Vintage Style
- **ID**: `vintage-style`
- **Description**: Warm sepia tones, soft lighting, classic aesthetic
- **Best For**: Portraits, lifestyle photos

### 2. Artistic Portrait
- **ID**: `artistic-portrait`
- **Description**: Oil painting techniques, soft brushstrokes
- **Best For**: Portrait photography

### 3. Professional Headshot
- **ID**: `professional-headshot`
- **Description**: Perfect lighting, enhanced skin tone, professional background
- **Best For**: Business profiles, LinkedIn photos

### 4. Fashion Editorial
- **ID**: `fashion-editorial`
- **Description**: High-fashion magazine style, dramatic lighting
- **Best For**: Fashion photography, model shots

### 5. Cinematic Look
- **ID**: `cinematic-look`
- **Description**: Movie-style color grading, dramatic lighting
- **Best For**: Portraits, artistic photos

### 6. Classic B&W
- **ID**: `black-white-classic`
- **Description**: Elegant monochrome with perfect contrast
- **Best For**: Any photo type

### 7. Soft Glow
- **ID**: `soft-glow`
- **Description**: Dreamy glow effect, enhanced skin smoothing
- **Best For**: Beauty photography, portraits

### 8. Urban Street
- **ID**: `urban-street`
- **Description**: Modern urban photography style, enhanced contrast
- **Best For**: Street photography, urban scenes

## Environment Variables Required

```bash
# Google Gemini AI
GEMINI_API_KEY=your_google_gemini_api_key

# AWS S3 (for image storage)
TRIALROOM_AWS_ACCESS_KEY_ID=your_aws_access_key
TRIALROOM_AWS_SECRET_ACCESS_KEY=your_aws_secret
TRIALROOM_AWS_S3_BUCKET_NAME=your_s3_bucket
TRIALROOM_AWS_REGION=us-east-1

# Database
DATABASE_URL=your_database_url

# Authentication
CLERK_SECRET_KEY=your_clerk_secret
```

## Error Types

- `SUBSCRIPTION_LIMIT`: User has exceeded their credit limit
- `RATE_LIMIT`: Google Gemini API rate limit exceeded
- `QUOTA_EXCEEDED`: Google Gemini API quota exceeded
- `AUTH_ERROR`: Invalid Google Gemini API key
- `SAFETY_FILTER`: Content blocked by AI safety filters

## Technical Details

- **AI Model**: Google Gemini 2.5 Flash Image Preview
- **Processing**: Synchronous (instant results)
- **Image Storage**: AWS S3
- **Database**: Prisma with existing TryOnRequest table
- **Authentication**: Clerk
- **Credits**: Consumes 1 credit per transformation

## Usage in Frontend

The API is designed to work with the Prompt Studio page (`/prompt-studio`) which provides:

1. **Image Upload**: Drag & drop or click to upload
2. **Style Selection**: Visual grid of transformation styles
3. **Instant Preview**: Immediate results after transformation
4. **Gallery**: History of all transformations
5. **Download/Share**: Export and share transformed images

## Rate Limiting & Retries

The API includes built-in retry logic with exponential backoff for handling:
- Google Gemini API rate limits
- Temporary network issues
- Quota exhaustion

Maximum 3 retries with increasing delays (1s, 2s, 4s).

## Database Schema

Uses existing `TryOnRequest` table with modified field usage:
- `modelImageUrl`: Stores original image URL
- `garmentImageUrl`: Temporarily stores result URL
- `resultImageUrl`: Stores final transformed image URL
- `category`: Stores `prompt:{promptId}` format
- `predictionId`: Uses `prompt-{uuid}` format
