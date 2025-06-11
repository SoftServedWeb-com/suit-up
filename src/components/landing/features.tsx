"use client";

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Camera, 
  Zap, 
  ArrowRight, 
  Check, 
  Star,
  Users,
  Brain,
  Target,
  Palette,
  ChevronRight,
  PlayCircle,
  Upload,
  Cpu,
  Wand2,
  MonitorSpeaker,
  Scissors,
  Share2
} from 'lucide-react';
import { SignInButton } from '@clerk/nextjs';

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  suffix?: string;
}

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
}

interface ProcessStep {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  details: string[];
}

interface UseCase {
  title: string;
  description: string;
  icon: React.ReactNode;
  benefits: string[];
}

interface TechSpec {
  label: string;
  value: string;
}

interface TechSpecs {
  [key: string]: TechSpec[];
}

interface Stat {
  value: number;
  suffix: string;
  label: string;
}

// Animated counter component
const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ end, duration = 2000, suffix = "" }) => {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    let startTime: number | null = null;
    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return <span>{count}{suffix}</span>;
};

const FeaturesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('technology');

  const stats: Stat[] = [
    { value: 99, suffix: "%", label: "Accuracy Rate" },
    { value: 15, suffix: "s", label: "Processing Time" },
    { value: 50, suffix: "K+", label: "Happy Users" },
    { value: 24, suffix: "/7", label: "Support" }
  ];

  const coreFeatures: Feature[] = [
    {
      icon: <Brain className="h-6 w-6" />,
      title: "Advanced AI Technology",
      description: "State-of-the-art computer vision and machine learning algorithms for photorealistic virtual try-ons.",
      features: [
        "Deep learning neural networks",
        "Pose estimation and body mapping",
        "Fabric texture understanding",
        "Color and lighting adaptation"
      ]
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Lightning Fast Processing",
      description: "Get professional-quality results in seconds with our optimized cloud infrastructure.",
      features: [
        "Sub-15 second processing",
        "Real-time preview capabilities",
        "Batch processing support",
        "Priority processing for Pro users"
      ]
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Precision Fitting",
      description: "Advanced body analysis ensures garments fit naturally with accurate proportions.",
      features: [
        "3D body reconstruction",
        "Accurate size mapping",
        "Natural garment draping",
        "Body type adaptation"
      ]
    },
    {
      icon: <Palette className="h-6 w-6" />,
      title: "Style Preservation",
      description: "Maintains the authentic look and feel of garments while adapting to different models.",
      features: [
        "Color accuracy maintenance",
        "Texture detail preservation",
        "Pattern alignment",
        "Brand aesthetic consistency"
      ]
    }
  ];

  const processSteps: ProcessStep[] = [
    {
      number: "1",
      title: "Image Upload & Analysis",
      description: "Upload your model and garment images. Our AI analyzes pose, lighting, and fabric properties.",
      icon: <Upload className="h-5 w-5 text-indigo-600" />,
      details: [
        "Automatic pose detection",
        "Lighting condition analysis",
        "Fabric type identification",
        "Quality optimization suggestions"
      ]
    },
    {
      number: "2",
      title: "AI Processing & Fitting",
      description: "Advanced algorithms create a 3D model and virtually fit the garment with realistic physics.",
      icon: <Cpu className="h-5 w-5 text-indigo-600" />,
      details: [
        "3D body reconstruction",
        "Garment physics simulation",
        "Lighting and shadow adjustment",
        "Color correction and matching"
      ]
    },
    {
      number: "3",
      title: "Result Generation",
      description: "Receive a photorealistic image that looks like a professional fashion shoot.",
      icon: <Wand2 className="h-5 w-5 text-indigo-600" />,
      details: [
        "High-resolution output",
        "Professional quality finishing",
        "Multiple format options",
        "Instant download availability"
      ]
    }
  ];

  const useCases: UseCase[] = [
    {
      title: "Fashion Designers",
      description: "Visualize designs on different body types before production",
      icon: <Scissors className="h-8 w-8 text-indigo-600" />,
      benefits: ["Reduce sampling costs", "Speed up design process", "Test on diverse models", "Client presentations"]
    },
    {
      title: "E-commerce Brands",
      description: "Create stunning product imagery without expensive photoshoots",
      icon: <MonitorSpeaker className="h-8 w-8 text-indigo-600" />,
      benefits: ["Reduce photography costs", "Consistent product imagery", "Quick catalog updates", "A/B test visuals"]
    },
    {
      title: "Fashion Models",
      description: "Build diverse portfolios and showcase versatility",
      icon: <Users className="h-8 w-8 text-indigo-600" />,
      benefits: ["Expand portfolio variety", "Try different styles", "Quick turnaround", "Cost-effective shooting"]
    },
    {
      title: "Content Creators",
      description: "Generate engaging fashion content for social media",
      icon: <Share2 className="h-8 w-8 text-indigo-600" />,
      benefits: ["Daily content creation", "Trend experimentation", "Brand collaborations", "Audience engagement"]
    }
  ];

  const techSpecs: TechSpecs = {
    technology: [
      { label: "AI Model", value: "Proprietary GANs + Diffusion Models" },
      { label: "Processing Speed", value: "< 15 seconds average" },
      { label: "Image Resolution", value: "Up to 4K (4096×4096)" },
      { label: "Supported Formats", value: "JPG, PNG, WebP" },
      { label: "Body Types", value: "All sizes and proportions" },
      { label: "Garment Categories", value: "Tops, Bottoms, Dresses, Outerwear" }
    ],
    integration: [
      { label: "API Access", value: "RESTful API with SDK" },
      { label: "Webhook Support", value: "Real-time status updates" },
      { label: "Batch Processing", value: "Up to 100 images/batch" },
      { label: "Cloud Infrastructure", value: "AWS with global CDN" },
      { label: "SLA Uptime", value: "99.9% guaranteed" },
      { label: "Rate Limits", value: "Customizable per plan" }
    ],
    security: [
      { label: "Data Encryption", value: "AES-256 end-to-end" },
      { label: "Image Storage", value: "Temporary with auto-deletion" },
      { label: "Compliance", value: "GDPR, CCPA compliant" },
      { label: "Authentication", value: "OAuth 2.0 + API Keys" },
      { label: "Data Centers", value: "SOC 2 Type II certified" },
      { label: "Privacy", value: "Zero data retention policy" }
    ]
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="relative z-50 px-6 py-6 border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-gray-900">
              Immersive
            </span>
          </div>
          
          <div className="hidden md:flex items-center space-x-12">
            <a href="/" className="text-gray-600 hover:text-indigo-600 transition-colors text-sm font-medium">Home</a>
            <a href="#features" className="text-indigo-600 text-sm font-medium">Features</a>
            <a href="#process" className="text-gray-600 hover:text-indigo-600 transition-colors text-sm font-medium">Process</a>
            <a href="#use-cases" className="text-gray-600 hover:text-indigo-600 transition-colors text-sm font-medium">Use Cases</a>
            <SignInButton mode="modal">
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
                Get Started
              </button>
            </SignInButton>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-20 lg:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl lg:text-7xl font-light text-gray-900 mb-6 leading-tight">
            Advanced
            <br />
            <span className="font-medium text-indigo-600">Fashion Technology</span>
          </h1>
          <p className="text-xl lg:text-2xl text-gray-600 mb-12 leading-relaxed max-w-3xl mx-auto">
            Discover the cutting-edge AI that transforms fashion visualization 
            with photorealistic precision and professional quality.
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-light text-gray-900 mb-2">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section id="features" className="px-6 py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-6">
              Core
              <span className="font-medium text-indigo-600"> Capabilities</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built with the latest advances in AI and computer vision to deliver 
              unparalleled quality and precision.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12">
            {coreFeatures.map((feature, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-xl p-8">
                <div className="h-12 w-12 bg-indigo-600 rounded-lg flex items-center justify-center mb-6 text-white">
                  {feature.icon}
                </div>
                
                <h3 className="text-xl font-medium text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed mb-6">{feature.description}</p>
                
                <ul className="space-y-3">
                  {feature.features.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center text-sm text-gray-700">
                      <Check className="h-4 w-4 text-indigo-600 mr-3 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-6">
              How It
              <span className="font-medium text-indigo-600"> Works</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our sophisticated AI pipeline transforms your images through advanced 
              computer vision and machine learning techniques.
            </p>
          </div>
          
          <div className="space-y-16">
            {processSteps.map((step, index) => (
              <div key={index} className="flex items-start gap-8">
                <div className="flex-shrink-0 w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-medium text-lg">
                  {step.number}
                </div>
                <div className="flex-1">
                  <div className="flex items-center mb-4">
                    {step.icon}
                    <h3 className="text-xl font-medium text-gray-900 ml-3">{step.title}</h3>
                  </div>
                  <p className="text-gray-600 mb-6 text-lg">{step.description}</p>
                  <ul className="grid md:grid-cols-2 gap-3">
                    {step.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-center text-sm text-gray-500">
                        <ChevronRight className="h-4 w-4 text-indigo-600 mr-2" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section id="use-cases" className="px-6 py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-6">
              Perfect for Every
              <span className="font-medium text-indigo-600"> Professional</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Whether you're a designer, brand, model, or content creator, 
              our platform adapts to your unique needs and workflow.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {useCases.map((useCase, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-xl p-8">
                <div className="mb-6">
                  {useCase.icon}
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-4">{useCase.title}</h3>
                <p className="text-gray-600 mb-6">{useCase.description}</p>
                <ul className="space-y-3">
                  {useCase.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className="flex items-center text-sm text-gray-700">
                      <Check className="h-4 w-4 text-indigo-600 mr-3 flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Specifications */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-6">
              Technical
              <span className="font-medium text-indigo-600"> Specifications</span>
            </h2>
            <p className="text-xl text-gray-600">
              Built for scale, security, and performance
            </p>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex justify-center mb-12">
            <div className="bg-gray-100 rounded-lg p-1">
              {Object.keys(techSpecs).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all capitalize text-sm ${
                    activeTab === tab 
                      ? 'bg-indigo-600 text-white' 
                      : 'text-gray-600 hover:text-indigo-600'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          
          {/* Tab Content */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8">
            <div className="grid lg:grid-cols-2 gap-8">
              {techSpecs[activeTab].map((spec, index) => (
                <div key={index} className="flex justify-between items-center py-4 border-b border-gray-200 last:border-b-0">
                  <span className="font-medium text-gray-700">{spec.label}</span>
                  <span className="text-gray-900 font-medium">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 bg-indigo-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-light mb-6">
            Ready to Experience
            <br />
            <span className="font-medium">The Future?</span>
          </h2>
          <p className="text-xl mb-12 opacity-90">
            Join thousands of fashion professionals already using our platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <SignInButton mode="modal">
              <button className="bg-white text-indigo-600 px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-50 transition-colors flex items-center">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </SignInButton>
            <button className="border border-white text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-white hover:text-indigo-600 transition-colors flex items-center">
              <PlayCircle className="mr-2 h-5 w-5" />
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900">Immersive</span>
            </div>
            
            <div className="flex space-x-8 text-sm text-gray-500">
              <a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a>
              <a href="#" className="hover:text-indigo-600 transition-colors">Terms</a>
              <a href="#" className="hover:text-indigo-600 transition-colors">Support</a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-100 text-center text-sm text-gray-400">
            <p>&copy; 2024 Immersive. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default FeaturesPage;