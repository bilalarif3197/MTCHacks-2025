import { UserCheck, Lock, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const Safety = () => {
  const safetyPoints = [
    {
      icon: UserCheck,
      title: "Human-in-the-Loop",
      description: "The clinician makes the final call on every finding. AI provides suggestions; you provide expertise.",
    },
    {
      icon: Lock,
      title: "De-Identified Data",
      description: "Demo uses public, de-identified datasets only. No patient health information (PHI) is processed.",
    },
  ];

  return (
    <section id="safety" className="py-20 px-4 bg-gradient-subtle">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12 animate-fade-in">
          <span className="text-sm font-semibold text-success uppercase tracking-wider">Safety & Compliance</span>
          <h2 className="text-4xl font-bold text-foreground mt-2 mb-4">Clinical Safety First</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built with patient safety and regulatory compliance at the core.
          </p>
        </div>

        <div className="max-w-5xl mx-auto space-y-6 mb-12">
          {safetyPoints.map((point, idx) => (
            <div 
              key={idx}
              className="flex gap-6 items-start p-6 rounded-xl bg-card border border-border hover:shadow-card transition-shadow animate-fade-in-up"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-success/10 flex items-center justify-center">
                <point.icon className="h-7 w-7 text-success" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">{point.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{point.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="max-w-4xl mx-auto animate-fade-in">
          <Alert className="bg-warning/10 border-warning/30">
            <AlertTriangle className="h-5 w-5 text-warning-foreground" />
            <AlertTitle className="text-foreground font-semibold">Important Disclaimer</AlertTitle>
            <AlertDescription className="text-muted-foreground">
              <strong>For investigational use / research demo only.</strong> This is a hackathon prototype intended for 
              educational and evaluation purposes. Not a medical device. Not for primary diagnostic use. The clinician 
              remains the final authority on all clinical decisions.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </section>
  );
};
