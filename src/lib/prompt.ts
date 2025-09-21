import { TransformationPrompt } from "@/components/prompt-studio";

export const PREDEFINED_PROMPTS: TransformationPrompt[] = [
    {
      id: "vintage-style",
      name: "Vintage Style",
      description: "Transform into a vintage aesthetic with warm tones and classic styling",
      prompt: "Transform this image into a vintage style with warm sepia tones, soft lighting, and classic aesthetic. Add subtle film grain and enhance the nostalgic atmosphere while maintaining the subject's features and pose.",
      category: "Style",
      icon: "🎞️",
      exampleImage: "https://res.cloudinary.com/duwh0ork4/image/upload/v1758442644/VintageFashion-1_1200px_wjqnjs.webp"
    },
    {
      id: "artistic-portrait",
      name: "Artistic Portrait",
      description: "Convert to an artistic painted portrait style",
      prompt: "Transform this image into an artistic painted portrait with oil painting techniques, soft brushstrokes, and enhanced colors. Maintain realistic proportions while adding artistic flair and depth.",
      category: "Art",
      icon: "🎨",
      exampleImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=400&fit=crop&crop=face&auto=format&q=80&blur=1&brightness=1.1"
    },
    {
      id: "professional-headshot",
      name: "Professional Headshot",
      description: "Enhance for professional photography look",
      prompt: "Transform this image into a professional headshot with perfect lighting, enhanced skin tone, professional background, and polished appearance suitable for business profiles.",
      category: "Professional",
      icon: "💼",
      exampleImage: "https://res.cloudinary.com/duwh0ork4/image/upload/v1758442567/images_yw6pyz.jpg"
    },
    {
      id: "fashion-editorial",
      name: "Fashion Editorial",
      description: "High-fashion magazine style transformation",
      prompt: "Transform this image into a high-fashion editorial style with dramatic lighting, enhanced contrast, professional makeup look, and magazine-quality aesthetic.",
      category: "Fashion",
      icon: "👗",
      exampleImage: "https://res.cloudinary.com/duwh0ork4/image/upload/v1758442517/ai-bw-studio-portrait-original-image_bdvdcy.webp"
    },
    {
      id: "cinematic-look",
      name: "Cinematic Look",
      description: "Movie-style cinematic transformation",
      prompt: "Transform this image with cinematic color grading, dramatic lighting, film-like quality, and movie poster aesthetic. Enhance mood and atmosphere while maintaining natural appearance.",
      category: "Cinematic",
      icon: "🎬",
      exampleImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop&crop=face&auto=format&q=80&tint=orange&contrast=1.3"
    },
    {
      id: "black-white-classic",
      name: "Classic B&W",
      description: "Elegant black and white transformation",
      prompt: "Transform this image into an elegant black and white photograph with perfect contrast, dramatic shadows, and classic monochrome aesthetic. Enhance texture and depth.",
      category: "Classic",
      icon: "⚫",
      exampleImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=400&fit=crop&crop=face&auto=format&q=80&sat=0&contrast=1.2"
    },
    {
      id: "soft-glow",
      name: "Soft Glow",
      description: "Dreamy soft glow effect",
      prompt: "Transform this image with a soft, dreamy glow effect, enhanced skin smoothing, warm lighting, and ethereal atmosphere. Create a romantic, gentle appearance.",
      category: "Beauty",
      icon: "✨",
      exampleImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=400&fit=crop&crop=face&auto=format&q=80&blur=0.5&brightness=1.2"
    },
    {
      id: "urban-street",
      name: "Urban Street",
      description: "Modern urban street photography style",
      prompt: "Transform this image into urban street photography style with enhanced contrast, city vibes, modern aesthetic, and contemporary street fashion look.",
      category: "Urban",
      icon: "🏙️",
      exampleImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=400&fit=crop&crop=face&auto=format&q=80&contrast=1.3&sat=1.1"
    },
    {
      id: "3d-action-figure",
      name: "3D Action Figure",
      description: "Create a commercialized 1/7 scale figure display",
      prompt: "Create a 1/7 scale commercialized figure of the character in the illustration, in a realistic style and environment. Place the figure on a computer desk, using a circular transparent acrylic base without any text. On the computer screen, display the ZBrush modeling process of the figure. Next to the computer screen, place a BANDAI-style toy packaging box printed with the original artwork.",
      category: "3D",
      icon: "🎮",
      exampleImage: "https://res.cloudinary.com/duwh0ork4/image/upload/v1758442173/3d-action-figure-generated-image_fts8tm.webp"
    },
    {
      id: "chibi-knitted-doll",
      name: "Chibi Knitted Doll",
      description: "Transform into a hand-crocheted yarn doll",
      prompt: "A close-up, professionally composed photograph showcasing a hand-crocheted yarn doll gently cradled by two hands. The doll has a rounded shape, featuring the cute chibi image of the character, with vivid contrasting colors and rich details. The hands holding the doll are natural and gentle, with clearly visible finger postures, and natural skin texture and light/shadow transitions, conveying a warm and realistic touch. The background is slightly blurred, depicting an indoor environment with a warm wooden tabletop and natural light streaming in from a window, creating a comfortable and intimate atmosphere. The overall image conveys a sense of exquisite craftsmanship and cherished warmth.",
      category: "Craft",
      icon: "🧸",
      requiresReferenceImage: true,
      exampleImage: "https://res.cloudinary.com/duwh0ork4/image/upload/v1758442187/chibi-knitted-doll-generated-image_dhk41g.webp"
    },
    {
      id: "chibi-emoji-sticker",
      name: "Chibi Emoji Sticker",
      description: "Create playful emoji-style stickers with various poses",
      prompt: "Making a playful peace sign with both hands and winking. Tearful eyes and slightly trembling lips, showing a cute crying expression. Arms wide open in a warm, enthusiastic hug pose. Lying on their side asleep, resting on a tiny pillow with a sweet smile. Pointing forward with confidence, surrounded by shining visual effects. Blowing a kiss, with heart symbols floating around. Maintain the chibi aesthetic. Exaggerated, expressive big eyes. Soft facial lines. Background: Vibrant red with star or colorful confetti elements for decoration. Leave some clean white space around each sticker. Aspect ratio: 9:16",
      category: "Emoji",
      icon: "😊",
      exampleImage: "https://res.cloudinary.com/duwh0ork4/image/upload/v1758442247/prompt-transform-1758438954702-b5220623-6634-4a08-9819-ea8af1832018_i1nul8.webp"
    },
    {
      id: "object-extraction",
      name: "Object Extraction",
      description: "Extract clothing as clean e-commerce product photo",
      prompt: "Extract the clothing from the image and present it as a clean e-commerce product photo. Remove the model's body completely. Keep the outfit in natural 3D shape, with realistic fabric folds, seams, and textures. Display the garment as if photographed on a mannequin or neatly laid flat, centered on a pure white or transparent background. High-resolution, professional lighting, suitable for online fashion catalog.",
      category: "E-commerce",
      icon: "👔",
      requiresReferenceImage: true,
      exampleImage: "https://res.cloudinary.com/duwh0ork4/image/upload/v1758442285/object-extraction-generated-image_g3oejq.webp"
    },
    {
      id: "photo-grid-pose",
      name: "3x3 Photo Grid Pose",
      description: "Create a 3x3 grid of different studio poses",
      prompt: "Turn the photo into a 3x3 grid of photo strips with different studio-style poses and expressions.",
      category: "Grid",
      icon: "📸",
      exampleImage: "https://res.cloudinary.com/duwh0ork4/image/upload/v1758442292/3x3-photo-grid-pose-generated-image_2025-09-12-081619_cvrb_qj33dc.webp"
    },
    {
      id: "ai-saree",
      name: "AI Saree",
      description: "Elegant saree portrait with sunflowers",
      prompt: "Create a soft, sunlit portrait wearing a flowing sheer yellow saree with delicate floral embroidery. Sit gracefully against a plain wall, bathed in warm natural light with a triangular patch of sunlight casting artistic shadows. Hold a vibrant bouquet of sunflowers close to the chest, and a small white flower is tucked behind the ear. Gentle expression, loose hair strands moving slightly, and the dreamy golden glow create a serene, poetic, and romantic atmosphere.",
      category: "Fashion",
      icon: "🌻",
      exampleImage: "https://res.cloudinary.com/duwh0ork4/image/upload/v1758442314/AI-saree-generated-image_zojay4.webp"
    },
    {
      id: "bw-studio-portrait",
      name: "AI B&W Studio Portrait",
      description: "Professional black and white studio portrait",
      prompt: "Please generate a top-angle and close-up black and white portrait of my face, focused on the head facing forward. Use a 35mm lens look, 10.7K 4HD quality. Proud expression. Deep black shadow background - only the face, the upper chest, and the shoulder.",
      category: "Studio",
      icon: "📷",
      exampleImage: "https://res.cloudinary.com/duwh0ork4/image/upload/v1758442320/ai-bw-studio-portrait-generated-image_ydz8rn.webp"
    },
    {
      id: "cinematic-portrait",
      name: "AI Cinematic Portrait",
      description: "Dramatic cinematic portrait with intense lighting",
      prompt: "Create a vertical portrait shot using the exact same face features, characterized by stark cinematic lighting and intense contrast. Captured in a slightly low, upward-facing angle that dramatized the subject's jawline and neck, the composition evokes quiet dominance and sculptural elegance. The background is a deep, saturated crimson red, creating a bold visual clash with the model's luminous skin and dark wardrobe.",
      category: "Cinematic",
      icon: "🎭",
      exampleImage: "https://res.cloudinary.com/duwh0ork4/image/upload/v1758442465/ai-cinematic-portrait-generated-image_o4vywo.webp"
    }
  ];