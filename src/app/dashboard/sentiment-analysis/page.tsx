"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useEffect } from "react";
import { analyze, AnalyzeState } from "@/actions/analyze";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Frown, Loader2, Meh, Smile } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";


function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
        </>
      ) : (
        "Analyze Sentiment"
      )}
    </Button>
  );
}

const initialState: AnalyzeState = {
  result: null,
  error: null,
};

export default function SentimentAnalysisPage() {
  const [state, formAction] = useFormState(analyze, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.error) {
      toast({
        variant: "destructive",
        title: "Analysis Error",
        description: state.error,
      });
    }
  }, [state.error, toast]);

  const sentimentScoreToPercentage = (score: number) => {
    return (score + 1) * 50;
  }

  const getSentimentIcon = (sentiment: string) => {
    const s = sentiment.toLowerCase();
    if (s.includes("positive")) return <Smile className="h-10 w-10 text-green-500" />;
    if (s.includes("negative")) return <Frown className="h-10 w-10 text-red-500" />;
    return <Meh className="h-10 w-10 text-yellow-500" />;
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Sentiment Analysis Tool</CardTitle>
          <CardDescription>
            Analyze employee feedback or HR reports to gauge sentiment. The AI will provide a score and flag if action is needed.
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent>
            <div className="grid w-full gap-2">
              <Label htmlFor="text">Text to analyze</Label>
              <Textarea
                id="text"
                name="text"
                placeholder="Paste text here..."
                rows={10}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>
      
      <Card className="h-fit">
        <CardHeader>
            <CardTitle>Analysis Result</CardTitle>
            <CardDescription>
                The sentiment analysis from the AI will appear here.
            </CardDescription>
        </CardHeader>
        <CardContent>
            {state.result ? (
                <div className="space-y-6">
                    <div className="flex items-center gap-4 rounded-lg border p-4">
                        {getSentimentIcon(state.result.sentiment)}
                        <div className="flex-1">
                            <p className="text-2xl font-bold capitalize">{state.result.sentiment}</p>
                            <p className="text-muted-foreground">Overall sentiment</p>
                        </div>
                        {state.result.flagForAction && (
                            <Badge variant="destructive" className="h-fit py-2 px-3">
                                <AlertTriangle className="mr-2 h-4 w-4" />
                                Action Required
                            </Badge>
                        )}
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Sentiment Score: {state.result.score.toFixed(2)}</Label>
                        <Progress value={sentimentScoreToPercentage(state.result.score)} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Very Negative</span>
                            <span>Neutral</span>
                            <span>Very Positive</span>
                        </div>
                    </div>

                    {state.result.reason && (
                        <div className="space-y-2">
                            <Label>Reasoning</Label>
                            <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-md">{state.result.reason}</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex justify-center items-center h-48 text-muted-foreground">
                    <p>No analysis performed yet.</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
