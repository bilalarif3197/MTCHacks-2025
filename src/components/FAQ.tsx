import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const FAQ = () => {
  const faqs = [
    {
      question: "Is this approved for clinical diagnosis?",
      answer: "No. This is a research prototype for evaluation purposes only. It is not a medical device and should not be used for primary diagnosis. All clinical decisions remain with licensed clinicians.",
    },
    {
      question: "What image types are supported?",
      answer: "The demo supports de-identified X-ray, CT, and MRI studies in DICOM format. The platform is optimized for chest radiography analysis.",
    },
    {
      question: "How are annotations handled?",
      answer: "Clinician annotations are stored on a separate layer from AI findings. You can view them side-by-side, merge them via Combined Overlay, or keep them separate for independent review.",
    },
    {
      question: "What is Consensus Highlighting?",
      answer: "Regions where both clinician and AI identify the same finding are subtly emphasized with a green glow. Mismatches or unique findings from either side are outlined separately for your review.",
    },
  ];

  return (
    <section id="faq" className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12 animate-fade-in">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">FAQ</span>
          <h2 className="text-4xl font-bold text-foreground mt-2 mb-4">Frequently Asked Questions</h2>
          <p className="text-lg text-muted-foreground">
            Common questions about Synapse's capabilities and usage.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4 animate-fade-in-up">
          {faqs.map((faq, idx) => (
            <AccordionItem 
              key={idx} 
              value={`item-${idx}`}
              className="bg-card border border-border rounded-lg px-6 data-[state=open]:shadow-card transition-shadow"
            >
              <AccordionTrigger className="text-left hover:no-underline py-5">
                <span className="font-semibold text-foreground pr-4">{faq.question}</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};
