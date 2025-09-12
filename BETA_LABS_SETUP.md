# Beta Labs Setup - Multi-Provider Virtual Try-On

## Overview
The Beta Labs feature provides access to multiple cutting-edge AI providers for virtual try-on functionality, allowing you to compare results and performance across different models.

## Available Providers

### 1. Google Gemini AI (Nano Banana)
- **Route**: `/api/try-on-beta`
- **Dashboard**: `/dashboard-beta`
- **Model**: `gemini-2.5-flash-image-preview`
- **Features**: Multi-modal input, instant results, text + images

### 2. BytePlus ModelArk (Seedream 4.0)
- **Route**: `/api/try-on-byteplus`
- **Dashboard**: `/dashboard-byteplus`
- **Model**: `seedream-4-0-250828`
- **Features**: 2K resolution, image-to-image generation, high quality

### 3. Fashn AI (Main/Production)
- **Route**: `/api/try-on`
- **Dashboard**: `/dashboard`
- **Features**: Asynchronous processing, proven reliability

## Environment Variables Required

Add these to your `.env.local` file:

```bash
# Google Gemini AI
GEMINI_API_KEY=your_google_gemini_api_key

# Optional: Gemini safety mode (STRICT, BALANCED, RELAXED)
# BALANCED is recommended for clothing try-on
GEMINI_SAFETY_MODE=BALANCED

# BytePlus ModelArk
ARK_API_KEY=your_byteplus_modelark_api_key

# Existing variables (already configured)
DATABASE_URL=your_database_url
CLERK_SECRET_KEY=your_clerk_secret
TRIALROOM_AWS_ACCESS_KEY_ID=your_aws_access_key
TRIALROOM_AWS_SECRET_ACCESS_KEY=your_aws_secret
TRIALROOM_AWS_S3_BUCKET_NAME=your_s3_bucket
FASHN_API_KEY=your_fashn_api_key
```

## Getting API Keys

### Google Gemini AI
1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key and add to `GEMINI_API_KEY`
5. (Optional) Configure safety mode with `GEMINI_SAFETY_MODE`

#### Safety Mode Configuration

The Gemini integration supports three safety modes:

| Mode | Threshold | Best For | Trade-offs |
|------|-----------|----------|------------|
| `STRICT` | `BLOCK_MEDIUM_AND_ABOVE` | High safety requirements | May block legitimate clothing images |
| `BALANCED` | `BLOCK_ONLY_HIGH` | **Recommended for clothing** | Good balance of safety and functionality |
| `RELAXED` | `OFF` | Maximum functionality | Minimal safety filtering |

**Recommendation**: Use `BALANCED` mode (default) for clothing try-on as it provides the best balance between safety and functionality.

### BytePlus ModelArk
1. Visit [BytePlus ModelArk Console](https://console.byteplus.com/modelark)
2. Create an account or sign in
3. Navigate to API Keys section
4. Generate a new API key
5. Copy the key and add to `ARK_API_KEY`

## Provider Comparison

| Feature | Fashn AI | Google Gemini | BytePlus ModelArk |
|---------|----------|---------------|------------------|
| **Processing** | Async (20-40s) | Sync (instant) | Sync (instant) |
| **Input Method** | Form data | Multi-image + text | Base image + prompt |
| **Resolution** | Standard | Standard | 2K (2048x2048) |
| **Quality** | High | Good | Very High |
| **Rate Limits** | Custom | Free tier limits | API tier limits |
| **Cost** | Per request | Per token | Per request |
| **Reliability** | Production | Beta | Beta |

## Usage Patterns

### For Testing & Comparison
1. **Start with Fashn AI** (main dashboard) for baseline results
2. **Try Google Gemini** (beta dashboard) for instant generation
3. **Use BytePlus** (byteplus dashboard) for highest quality

### For Production
- **Primary**: Fashn AI for reliability
- **Fallback**: Google Gemini for speed
- **Premium**: BytePlus for quality

## API Response Formats

### Fashn AI (Async)
```json
{
  "success": true,
  "requestId": "cuid",
  "predictionId": "fashn-id",
  "status": "submitted",
  "message": "Processing...",
  "creditsRemaining": 19
}
```

### Google Gemini (Sync)
```json
{
  "success": true,
  "requestId": "cuid",
  "predictionId": "gemini-uuid",
  "status": "completed",
  "resultImageUrl": "https://s3-url",
  "provider": "gemini",
  "creditsRemaining": 19
}
```

### BytePlus (Sync)
```json
{
  "success": true,
  "requestId": "cuid",
  "predictionId": "byteplus-uuid",
  "status": "completed",
  "resultImageUrl": "https://generated-url",
  "provider": "byteplus",
  "model": "seedream-4-0-250828",
  "creditsRemaining": 19
}
```

## Error Handling

All providers include comprehensive error handling for:
- **Rate Limiting**: Exponential backoff retry
- **Authentication**: Invalid API key detection
- **Quota Limits**: Free tier exhaustion
- **Network Issues**: Connection failures
- **Credit System**: Subscription limits

## Navigation Structure

```
/dashboard (Main)
├── Beta Labs Section
│   ├── Google Gemini Lab → /dashboard-beta
│   └── BytePlus Lab → /dashboard-byteplus
├── Main Try-On (Fashn AI)
└── History (All providers combined)

/dashboard-beta (Gemini)
├── Back to Main Dashboard
├── Gemini Try-On Interface
└── Gemini History (filtered)

/dashboard-byteplus (BytePlus)
├── Back to Main Dashboard
├── BytePlus Try-On Interface
└── BytePlus History (filtered)
```

## Database Integration

All providers use the same database schema:
- **Prediction ID Prefixes**: 
  - Fashn AI: No prefix
  - Google Gemini: `gemini-`
  - BytePlus: `byteplus-`
- **Shared Credit System**: All providers consume from the same credit pool
- **Unified History**: Results stored in same `TryOnRequest` table

## Testing Workflow

1. **Set up API keys** for all providers
2. **Test each provider** individually
3. **Compare results** across providers
4. **Monitor costs** and usage patterns
5. **Choose optimal provider** for your use case

## Cost Considerations

### Google Gemini
- **Free Tier**: Limited requests per day
- **Paid Tier**: ~$0.01-0.05 per generation
- **Rate Limits**: Strict on free tier

### BytePlus ModelArk
- **Pricing**: Per API call
- **Quality**: High-resolution 2K output
- **Rate Limits**: Based on plan

### Fashn AI
- **Custom Pricing**: Based on your plan
- **Reliability**: Production-ready
- **Processing Time**: Longer but consistent

## Best Practices

1. **Start with Free Tiers** for testing
2. **Monitor Usage** across all providers
3. **Implement Fallbacks** between providers
4. **Cache Results** to reduce API calls
5. **User Feedback** to optimize provider choice
6. **A/B Test** different providers for your audience

## Troubleshooting

### Common Issues
1. **Rate Limits**: Implement proper retry logic (already included)
2. **API Key Issues**: Verify keys are correctly set
3. **Image Quality**: Different providers may have different results
4. **Processing Time**: Sync vs async differences

### Monitoring
- Check console logs for detailed error messages
- Monitor API usage in respective provider dashboards
- Track success rates across providers
- Monitor user satisfaction with different results

The Beta Labs setup provides a comprehensive testing environment for evaluating multiple AI providers and choosing the best fit for your virtual try-on needs.
