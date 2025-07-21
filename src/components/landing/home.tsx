import {
    SignInButton
  } from "@clerk/nextjs";
  import { redirect } from "next/navigation";
  import { auth } from "@clerk/nextjs/server";
  import { 
    Sparkles, 
    Camera, 
    Zap, 
    ArrowRight, 
    Check, 
    Star,
    Users,
    Shirt,
    ChevronDown
  } from 'lucide-react';
  
  interface Feature {
    icon: React.ReactNode;
    title: string;
    description: string;
  }
  
  interface Step {
    number: string;
    title: string;
    description: string;
  }
  
  interface Testimonial {
    name: string;
    role: string;
    quote: string;
  }
  
  export default async function Home2() {
    const { userId} = await auth();
    
    // if (userId) {
    //   return redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`);
    // }
  
    const features: Feature[] = [
      {
        icon: <Camera className="h-6 w-6" />,
        title: "AI-Powered Precision",
        description: "Advanced computer vision creates photorealistic virtual try-ons with perfect fitting and natural draping."
      },
      {
        icon: <Zap className="h-6 w-6" />,
        title: "Instant Results",
        description: "Professional-quality images generated in seconds, streamlining your creative workflow."
      },
      {
        icon: <Users className="h-6 w-6" />,
        title: "Universal Compatibility",
        description: "Works seamlessly with any model, any garment, maintaining authentic style and proportions."
      }
    ];
  
    const steps: Step[] = [
      { number: "01", title: "Upload", description: "Add your model and garment photos" },
      { number: "02", title: "Process", description: "AI analyzes and creates the perfect fit" },
      { number: "03", title: "Download", description: "Get your professional result instantly" }
    ];
  
    const testimonials: Testimonial[] = [
      {
        name: "Elena Rodriguez",
        role: "Creative Director",
        quote: "The quality is indistinguishable from a professional photoshoot. It's revolutionized our design process."
      },
      {
        name: "Marcus Chen",
        role: "Fashion Designer",
        quote: "Finally, a tool that understands the nuances of fashion. The results are consistently stunning."
      },
      {
        name: "Sophia Laurent",
        role: "Fashion Model",
        quote: "This technology captures the essence of how clothes actually look and feel. Absolutely game-changing."
      }
    ];
  
    return (
      <div className="min-h-screen bg-background rounded-md ring ring-ring/70">
        {/* Navigation */}
        <nav className="relative z-50 px-6 py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-gray-900">
                TrialRoom Studio
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-12">
              <SignInButton mode="modal">
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
                  Dashboard
                </button>
              </SignInButton>
            </div>
          </div>
        </nav>
  
        {/* Hero Section */}
        <section className="px-6 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
             <div className="mb-8">
            <h1 className="text-5xl lg:text-7xl font-light text-gray-900 mb-8 leading-tight tracking-tight">
              Elevate the Art of <br />
              <span className="font-serif font-semibold text-black">Bespoke Fashion</span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-600 mb-12 leading-relaxed max-w-3xl mx-auto font-light">
              Present your custom-tailored designs with editorial precision. Our AI recreates the fitting room experience—virtually.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
              <SignInButton mode="modal">
                <button className="group bg-black hover:bg-gray-900 text-white px-8 py-4 rounded-lg text-lg font-medium transition-all flex items-center">
                  Start Creating
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </SignInButton>
              <button className="text-gray-700 hover:text-black transition-colors text-lg font-medium">
                Watch Demo
              </button>
            </div>
          </div>
            
            {/* Hero Visual */}
            <div className="relative max-w-5xl mx-auto">
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-12">
                <div className="grid grid-cols-3 gap-12 items-center">
                  <div className="text-center">
                    <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mb-4">
                      <Users className="h-16 w-16 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">Original Photo</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="h-12 w-12 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-8">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div className="h-px bg-gradient-to-r from-transparent via-indigo-300 to-transparent mb-8"></div>
                    <p className="text-sm text-indigo-600 font-medium">AI Processing</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="h-48 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl flex items-center justify-center mb-4 border border-indigo-200">
                      <Shirt className="h-16 w-16 text-indigo-600" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">Perfect Result</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Scroll Indicator */}
            <div className="mt-20 flex justify-center">
              <ChevronDown className="h-6 w-6 text-gray-400 animate-bounce" />
            </div>
          </div>
        </section>
  
        {/* Features Section */}
        <section id="features" className="px-6 py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-6">
                Professional-Grade
                <span className="font-medium text-indigo-600"> Technology</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Built for fashion professionals who demand precision, quality, and reliability.
              </p>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-12">
              {features.map((feature, index) => (
                <div key={index} className="text-center">
                  <div className="h-14 w-14 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-6 text-white">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
  
        {/* Process Section */}
        <section id="how-it-works" className="px-6 py-20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-6">
                Simple
                <span className="font-medium text-indigo-600"> Process</span>
              </h2>
              <p className="text-xl text-gray-600">
                From upload to download in under 30 seconds
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-12">
              {steps.map((step, index) => (
                <div key={index} className="text-center relative">
                  <div className="h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-lg font-medium">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                  
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-indigo-200 to-transparent transform -translate-y-1/2"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
  
        {/* Testimonials Section */}
        <section id="testimonials" className="px-6 py-20 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-6">
                Trusted by
                <span className="font-medium text-indigo-600"> Professionals</span>
              </h2>
              <div className="flex justify-center items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
                <span className="ml-3 text-lg text-gray-600">4.9/5 from 2,500+ reviews</span>
              </div>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-xl p-8">
                  <div className="flex items-center gap-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-6 text-lg">
                    "{testimonial.quote}"
                  </p>
                  <div>
                    <p className="font-medium text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
  
        {/* CTA Section */}
        <section className="px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-6">
              Ready to
              <span className="font-medium text-indigo-600"> Transform</span>
              <br />
              Your Workflow?
            </h2>
            <p className="text-xl text-gray-600 mb-12">
              Join thousands of fashion professionals creating stunning visuals with AI
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <SignInButton mode="modal">
                <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-lg text-lg font-medium transition-colors flex items-center">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </SignInButton>
              <button className="border border-gray-300 hover:border-indigo-300 text-gray-700 hover:text-indigo-600 px-8 py-4 rounded-lg text-lg font-medium transition-colors">
                Schedule Demo
              </button>
            </div>
            
            <div className="flex justify-center items-center gap-8 text-sm text-gray-500">
              <div className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-indigo-600" />
                Free 7-day trial
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-indigo-600" />
                No credit card required
              </div>
              <div className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-indigo-600" />
                Cancel anytime
              </div>
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
                <span className="text-lg font-semibold text-gray-900">TrialRoom Studio</span>
              </div>
              
              <div className="flex space-x-8 text-sm text-gray-500">
                <a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a>
                <a href="#" className="hover:text-indigo-600 transition-colors">Terms</a>
                <a href="#" className="hover:text-indigo-600 transition-colors">Support</a>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-gray-100 text-center text-sm text-gray-400">
              <p>&copy; 2024 TrialRoom Studio. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    );
  }