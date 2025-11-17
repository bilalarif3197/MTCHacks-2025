import { Upload, PenTool, Download } from "lucide-react";
import modalitiesIcon from "@/assets/modalities-icon.jpg";
import annotationIcon from "@/assets/annotation-tools.jpg";
import consensusIcon from "@/assets/consensus-highlight.jpg";

export const Workflow = () => {
  const steps = [
    {
      number: "01",
      icon: Upload,
      image: modalitiesIcon,
      title: "Upload DICOM",
      description: "Accepts common modalities: X-ray, CT, MRI. Demo uses de-identified samples for immediate testing.",
      details: ["Drag & drop files", "Multiple formats supported", "Sample gallery included"],
    },
    {
      number: "02",
      icon: PenTool,
      image: annotationIcon,
      title: "Annotate & Review",
      description: "Draw regions, add measurements, and labels as usual. AI analysis appears side-by-side with confidence scores.",
      details: ["Rectangle, polygon, arrow tools", "Side-by-side comparison", "AI rationale snippets"],
    },
    {
      number: "03",
      icon: Download,
      image: consensusIcon,
      title: "View Consensus",
      description: "Toggle Combined Overlay to see mutual agreements highlighted between clinician annotations and AI findings.",
      details: ["Consensus highlighting", "Visual agreement indicators", "Side-by-side comparison"],
    },
  ];

  return (
    <section id="workflow" className="py-20 px-4 bg-gradient-subtle">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16 animate-fade-in">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">How It Works</span>
          <h2 className="text-4xl font-bold text-foreground mt-2 mb-4">Three Simple Steps</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From upload to export in minutes. No complex setup, no steep learning curve.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, idx) => (
            <div 
              key={idx} 
              className="group relative animate-fade-in-up"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="bg-card rounded-xl p-8 border border-border hover:shadow-elegant transition-all duration-300 h-full">
                {/* Step Number */}
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center shadow-card">
                  <span className="text-primary-foreground font-bold">{step.number}</span>
                </div>

                {/* Icon & Image */}
                <div className="mb-6 mt-4">
                  <div className="w-full h-48 rounded-lg overflow-hidden bg-muted mb-4">
                    <img 
                      src={step.image} 
                      alt={step.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-foreground">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                  
                  {/* Details List */}
                  <ul className="space-y-2 pt-2">
                    {step.details.map((detail, detailIdx) => (
                      <li key={detailIdx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Connector Arrow (except last) */}
              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-border" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
