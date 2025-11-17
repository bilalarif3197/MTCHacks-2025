import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Globe } from "lucide-react";
import { Link } from "react-scroll";
import heroImage from "@/assets/hero-medical-interface.jpg";

export const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 px-4 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-subtle -z-10" />
      
      <div className="container mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                AI-assisted reads, with{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  you in control
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
                Upload a case, annotate as you normally do, and compare with AI on a clean, side-by-side canvas.
                Combine views to highlight agreement.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <Link to="demo" spy smooth offset={-80} duration={500}>
                <Button size="lg" variant="hero" className="text-base">
                  Try the Demo
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-3 pt-4">
              <Badge variant="secondary" className="px-3 py-1.5 gap-2">
                <Shield className="h-3.5 w-3.5" />
                Research Prototype
              </Badge>
              <Badge variant="secondary" className="px-3 py-1.5 gap-2">
                <Globe className="h-3.5 w-3.5" />
                Open Source
              </Badge>
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-muted-foreground pt-2 max-w-xl">
              Hackathon prototype for research and evaluation only. Not approved for clinical diagnosis.
            </p>
          </div>

          {/* Right Visual */}
          <div className="relative animate-fade-in-up lg:animate-fade-in">
            <div className="relative rounded-xl overflow-hidden shadow-elegant border border-border bg-card">
              {/* Browser Chrome */}
              <div className="bg-muted px-4 py-3 border-b border-border flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-warning/60" />
                  <div className="w-3 h-3 rounded-full bg-success/60" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-background px-4 py-1 rounded text-xs text-muted-foreground">
                    synapse.app/viewer
                  </div>
                </div>
              </div>

              {/* Image */}
              <div className="relative aspect-video">
                <img 
                  src={heroImage} 
                  alt="Side-by-side medical image analysis interface showing doctor annotations on left and AI findings on right"
                  className="w-full h-full object-cover"
                />
                
                {/* Mode Toggle Overlay */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-sm rounded-lg shadow-card border border-border px-4 py-2">
                  <div className="flex items-center gap-3 text-xs">
                    <button className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md font-medium">
                      Side-by-Side
                    </button>
                    <button className="px-3 py-1.5 hover:bg-muted rounded-md transition-colors">
                      Combined Overlay
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary-glow/20 rounded-full blur-3xl -z-10" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-accent/20 rounded-full blur-3xl -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
};
