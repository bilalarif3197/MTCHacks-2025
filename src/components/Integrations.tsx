import { Server } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Integrations = () => {
  const integrations = [
    {
      icon: Server,
      title: "HOPPR API",
      description: "Powered by HOPPR for inference orchestration, routing requests to specialized AI models.",
      badges: ["Orchestration", "Model Management"],
    },
  ];

  return (
    <section id="integrations" className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16 animate-fade-in">
          <span className="text-sm font-semibold text-accent uppercase tracking-wider">Integrations</span>
          <h2 className="text-4xl font-bold text-foreground mt-2 mb-4">AI-Powered Analysis</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built on HOPPR AI for accurate chest radiography analysis across 13+ pathology models.
          </p>
        </div>

        <div className="flex justify-center max-w-5xl mx-auto">
          {integrations.map((integration, idx) => (
            <div
              key={idx}
              className="p-8 rounded-xl border border-border bg-card hover:shadow-elegant hover:border-accent/30 transition-all duration-300 animate-fade-in-up max-w-xl w-full"
              style={{ animationDelay: `${idx * 75}ms` }}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <integration.icon className="h-6 w-6 text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-2">{integration.title}</h3>
                </div>
              </div>
              <p className="text-muted-foreground mb-4 leading-relaxed">{integration.description}</p>
              <div className="flex flex-wrap gap-2">
                {integration.badges.map((badge, badgeIdx) => (
                  <Badge key={badgeIdx} variant="secondary" className="text-xs">
                    {badge}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
