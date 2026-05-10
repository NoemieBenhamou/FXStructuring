import tarfCase from "@/data/fx/audusd-tarf-case.json";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const localeCopy = {
  en: {
    technical:
      "AUDJPY hedging discussion supports a structured zero-premium package when the client wants improved carry but can tolerate sold-option or barrier features. Relative volatility and skew justify comparing a risk reversal against a knock-out forward before escalating to TARF complexity.",
    client:
      "You can improve today’s hedge level if you accept that some favorable market moves may be capped or that protection can switch off under predefined conditions. The right structure depends on whether budget certainty or carry improvement matters more.",
    email:
      "We recommend comparing a plain forward, a zero-cost risk reversal and a knock-out forward against your budget rate. The next step is to confirm cashflow certainty, downside tolerance and whether any barrier feature is acceptable for governance purposes."
  },
  de: {
    technical:
      "Die AUDJPY-Absicherungsdiskussion spricht fuer ein strukturiertes Zero-Premium-Paket, wenn der Kunde besseren Carry sucht und gleichzeitig verkaufte Optionen oder Barrier-Elemente tragen kann. Volatilitaet und Skew sprechen fuer einen Vergleich von Risk Reversal und Knock-Out Forward vor einer TARF-Eskalation.",
    client:
      "Sie koennen das heutige Hedge-Niveau verbessern, wenn Sie akzeptieren, dass guenstige Marktbewegungen teilweise begrenzt werden oder der Schutz unter definierten Bedingungen entfaellt. Entscheidend ist, ob Budgetsicherheit oder Carry-Verbesserung wichtiger ist.",
    email:
      "Wir empfehlen den Vergleich eines Plain-Forward, eines Zero-Cost Risk Reversal und eines Knock-Out Forward gegen Ihren Budgetkurs. Der naechste Schritt ist die Bestaetigung von Cashflow-Sicherheit, Verlusttoleranz und der Governance-Faehigkeit moeglicher Barrier-Features."
  },
  fr: {
    technical:
      "La discussion de couverture AUDJPY soutient une solution structuree sans prime lorsque le client recherche un meilleur carry tout en acceptant des options vendues ou des caracteristiques de barriere. La volatilite relative et le skew justifient une comparaison entre risk reversal et knock-out forward avant toute complexite de type TARF.",
    client:
      "Vous pouvez ameliorer le niveau de couverture actuel si vous acceptez qu'une partie des mouvements favorables soit plafonnee ou que la protection puisse disparaitre selon des conditions predeterminees. Le bon choix depend de la priorite entre certitude budgetaire et amelioration du carry.",
    email:
      "Nous recommandons de comparer un forward simple, un risk reversal zero-cost et un knock-out forward par rapport au cours budget. La prochaine etape consiste a confirmer la certitude du flux, la tolerance au downside et l'acceptabilite d'une barriere du point de vue de la gouvernance."
  }
} as const;

export function ClientSummary({ locale }: { locale: string }) {
  const copy = localeCopy[locale as keyof typeof localeCopy] ?? localeCopy.en;

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card className="rounded-3xl">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Technical explanation</CardTitle>
            <Badge variant="blue">Desk framing</Badge>
          </div>
        </CardHeader>
        <CardContent className="text-sm leading-7 text-bank-muted">{copy.technical}</CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Client-friendly explanation</CardTitle>
            <Badge variant="gold">Distribution tone</Badge>
          </div>
        </CardHeader>
        <CardContent className="text-sm leading-7 text-bank-muted">{copy.client}</CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Email-ready summary</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-7 text-bank-muted">{copy.email}</CardContent>
      </Card>

      <Card className="rounded-3xl border-bank-amber/60 bg-bank-amber/10">
        <CardHeader>
          <CardTitle>Risk warning</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-7 text-amber-100">{tarfCase.riskWarning}</CardContent>
      </Card>
    </div>
  );
}
